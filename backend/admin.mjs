#!/usr/bin/env node
/**
 * CLI d'administration Pentaguin — à exécuter SUR le serveur (accès direct à la
 * base, aucun endpoint public exposé). Node 22+ avec --experimental-sqlite.
 *
 * Exemples (via SSH) :
 *   ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs stats'
 *   ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs players'
 *   ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs user Tux'
 *   ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs reset-xp --yes'
 *   ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs reset-ranks --yes'
 *   ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs reset-all --yes'
 *   ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs wipe-users --yes'
 *   ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs set-progress Tux /tmp/demo.json --yes'
 *   ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs clear-progress Tux --yes'
 *   ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs create-demo review@… <mdp> Tux --yes'
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

import { hashPassword } from './auth.mjs';
import { mergeSnapshots } from './progress.mjs';

const DB_PATH = process.env.DB_PATH ?? '/var/lib/pentaguin/pentaguin.db';
const [cmd, ...args] = process.argv.slice(2);
const hasYes = args.includes('--yes');

const LEAGUES = [
  ['Bronze III', 'Bronze II', 'Bronze I'],
  ['Argent III', 'Argent II', 'Argent I'],
  ['Or III', 'Or II', 'Or I'],
  ['Platine III', 'Platine II', 'Platine I'],
].flat();
const rankLabel = (r) =>
  r == null ? '—' : r <= 12 ? LEAGUES[r - 1] : { 13: 'Diamant', 14: 'Maître', 15: 'Empereur' }[r] ?? String(r);

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

function open(readOnly = true) {
  return new DatabaseSync(DB_PATH, { readOnly });
}

function stats() {
  const db = open(true);
  const one = (sql, ...p) => db.prepare(sql).get(...p);
  const all = (sql, ...p) => db.prepare(sql).all(...p);

  const users = one('SELECT COUNT(*) n FROM users').n;
  const verified = one('SELECT COUNT(*) n FROM users WHERE email_verified = 1').n;
  const twofa = one('SELECT COUNT(*) n FROM users WHERE totp_enabled = 1').n;
  const byEmail = one('SELECT COUNT(*) n FROM users WHERE password_hash IS NOT NULL').n;
  const byApple = one('SELECT COUNT(*) n FROM users WHERE apple_sub IS NOT NULL').n;
  const byGoogle = one('SELECT COUNT(*) n FROM users WHERE google_sub IS NOT NULL').n;
  const players = one('SELECT COUNT(*) n FROM players').n;
  const ranked = one('SELECT COUNT(*) n FROM players WHERE rank IS NOT NULL').n;
  const withPseudo = one("SELECT COUNT(*) n FROM players WHERE pseudo <> ''").n;
  const totalXp = one('SELECT COALESCE(SUM(xp),0) x FROM daily_xp').x;
  const active7 = one('SELECT COUNT(DISTINCT device_id) n FROM daily_xp WHERE date >= ?', daysAgo(6)).n;
  const activeToday = one('SELECT COUNT(DISTINCT device_id) n FROM daily_xp WHERE date = ?', today()).n;
  const errors24 = one('SELECT COUNT(*) n FROM error_reports WHERE created_at >= ?', Date.now() - 86_400_000).n;
  const errors7 = one('SELECT COUNT(*) n FROM error_reports WHERE created_at >= ?', Date.now() - 7 * 86_400_000).n;

  console.log('\n=== PENTAGUIN · STATS ===\n');
  console.log(`Comptes           : ${users}  (e-mail vérifié: ${verified}, 2FA: ${twofa})`);
  console.log(`  par fournisseur : e-mail ${byEmail} · Apple ${byApple} · Google ${byGoogle}`);
  console.log(`Joueurs           : ${players}  (avec pseudo: ${withPseudo}, classés: ${ranked})`);
  console.log(`XP cumulé         : ${totalXp}`);
  console.log(`Actifs aujourd'hui: ${activeToday}   ·   7 derniers jours: ${active7}`);
  console.log(`Rapports d'erreur : ${errors24} (24 h) · ${errors7} (7 j)`);

  const dist = all('SELECT rank, COUNT(*) n FROM players WHERE rank IS NOT NULL GROUP BY rank ORDER BY rank');
  if (dist.length) {
    console.log('\nRépartition des rangs :');
    for (const row of dist) console.log(`  ${String(row.rank).padStart(2)} ${rankLabel(row.rank).padEnd(11)} ${row.n}`);
  }

  const top = all(`
    SELECT p.pseudo, p.rank, COALESCE(SUM(d.xp),0) xp
    FROM players p LEFT JOIN daily_xp d ON d.device_id = p.device_id
    WHERE p.pseudo <> '' GROUP BY p.device_id ORDER BY xp DESC LIMIT 10
  `);
  if (top.length) {
    console.log('\nTop 10 (XP) :');
    top.forEach((r, i) => console.log(`  ${String(i + 1).padStart(2)}. ${(r.pseudo || '—').padEnd(20)} ${String(r.xp).padStart(7)} XP   ${rankLabel(r.rank)}`));
  }
  console.log('');
  db.close();
}

function players() {
  const db = open(true);
  const rows = db.prepare(`
    SELECT p.pseudo, p.rank, p.avatar, p.updated_at, COALESCE(SUM(d.xp),0) xp,
           CASE WHEN p.user_id IS NULL THEN 'anon' ELSE 'compte' END kind
    FROM players p LEFT JOIN daily_xp d ON d.device_id = p.device_id
    GROUP BY p.device_id ORDER BY xp DESC
  `).all();
  console.log(`\n=== JOUEURS (${rows.length}) ===\n`);
  console.log('PSEUDO'.padEnd(22) + 'XP'.padStart(8) + '  ' + 'RANG'.padEnd(12) + 'TYPE'.padEnd(8) + 'MAJ');
  for (const r of rows) {
    const d = new Date(r.updated_at).toISOString().slice(0, 10);
    console.log((r.pseudo || '—').padEnd(22) + String(r.xp).padStart(8) + '  ' + rankLabel(r.rank).padEnd(12) + r.kind.padEnd(8) + d);
  }
  console.log('');
  db.close();
}

function user(needle) {
  if (!needle) return console.error('usage: admin.mjs user <pseudo|email>');
  const db = open(true);
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(String(needle).toLowerCase());
  const p = db.prepare(`
    SELECT p.*, COALESCE(SUM(d.xp),0) xp FROM players p
    LEFT JOIN daily_xp d ON d.device_id = p.device_id
    WHERE p.pseudo = ? ${u ? 'OR p.user_id = ?' : ''} GROUP BY p.device_id
  `).get(...(u ? [needle, u.id] : [needle]));
  if (!p && !u) { console.log('Introuvable.'); db.close(); return; }
  console.log('\n=== UTILISATEUR ===');
  if (u) console.log(`Compte  : ${u.email ?? '(social)'} · vérifié:${u.email_verified} · 2FA:${u.totp_enabled} · créé ${new Date(u.created_at).toISOString().slice(0,10)}`);
  if (p) {
    console.log(`Pseudo  : ${p.pseudo || '—'}   avatar:${p.avatar ?? '—'}`);
    console.log(`Rang    : ${rankLabel(p.rank)}   XP:${p.xp}`);
    const hist = db.prepare('SELECT date, xp FROM daily_xp WHERE device_id = ? ORDER BY date DESC LIMIT 14').all(p.device_id);
    if (hist.length) { console.log('XP par jour (14 derniers) :'); for (const h of hist) console.log(`  ${h.date}  ${h.xp}`); }
  }
  console.log('');
  db.close();
}

/** Retrouve l'id de compte d'un utilisateur par pseudo ou e-mail. */
function findUserId(db, needle) {
  const key = String(needle ?? '').trim();
  if (!key) return null;
  const byEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(key.toLowerCase());
  if (byEmail) return byEmail.id;
  const byPseudo = db.prepare('SELECT user_id FROM players WHERE pseudo = ? AND user_id IS NOT NULL').get(key);
  return byPseudo?.user_id ?? null;
}

/**
 * Écrit une progression de démonstration dans la sauvegarde cloud d'un compte.
 * Sert à préparer les captures App Store et le compte de test App Review. La
 * fusion reste sans régression : ce qui existe déjà et vaut plus est conservé.
 * Snapshot produit par `node content-tools/demo-snapshot.mjs`.
 */
function setProgress(needle, file) {
  if (!needle || !file) return console.error('usage: admin.mjs set-progress <pseudo|email> <snapshot.json> --yes');
  if (!hasYes) { console.error('⚠ Écrase la sauvegarde cloud du compte. Ajoute --yes pour confirmer.'); process.exit(1); }
  const incoming = JSON.parse(readFileSync(file, 'utf8'));
  const db = open(false);
  const userId = findUserId(db, needle);
  if (!userId) { console.error(`Compte introuvable : ${needle}`); db.close(); process.exit(1); }
  const row = db.prepare('SELECT data FROM progress WHERE user_id = ?').get(userId);
  const current = row ? JSON.parse(row.data) : null;
  const merged = current ? mergeSnapshots(current, incoming) : incoming;
  db.prepare(
    `INSERT INTO progress (user_id, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  ).run(userId, JSON.stringify(merged), Date.now());
  // Le classement lit players : on aligne rang et XP du jour pour rester cohérent.
  const rank = Number.parseInt(merged.kv?.player_rank ?? '', 10);
  if (Number.isFinite(rank)) db.prepare('UPDATE players SET rank = ? WHERE user_id = ?').run(rank, userId);
  const player = db.prepare('SELECT device_id FROM players WHERE user_id = ?').get(userId);
  if (player) {
    for (const [date, xp] of Object.entries(merged.activity ?? {})) {
      db.prepare(
        `INSERT INTO daily_xp (device_id, date, xp) VALUES (?, ?, ?)
         ON CONFLICT(device_id, date) DO UPDATE SET xp = MAX(daily_xp.xp, excluded.xp)`,
      ).run(player.device_id, date, Number(xp) || 0);
    }
  }
  const xp = Object.values(merged.activity ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);
  db.close();
  console.log(`✔ Progression écrite pour ${needle} : rang ${rankLabel(rank)}, ${xp} XP, ` +
    `${Object.keys(merged.lessons ?? {}).length} leçons, ${Object.keys(merged.kv ?? {}).length} clés.`);
  console.log('  Relance l\'app (fermeture complète puis réouverture) pour la récupérer.');
}

/** Vide la sauvegarde cloud d'un compte (annule une progression de démo). */
function clearProgress(needle) {
  if (!needle) return console.error('usage: admin.mjs clear-progress <pseudo|email> --yes');
  if (!hasYes) { console.error('⚠ Supprime la sauvegarde cloud du compte. Ajoute --yes pour confirmer.'); process.exit(1); }
  const db = open(false);
  const userId = findUserId(db, needle);
  if (!userId) { console.error(`Compte introuvable : ${needle}`); db.close(); process.exit(1); }
  const n = db.prepare('DELETE FROM progress WHERE user_id = ?').run(userId).changes;
  db.close();
  console.log(`✔ Sauvegarde supprimée pour ${needle} : ${n} ligne(s).`);
  console.log('  La progression locale du téléphone n\'est pas touchée : réinstalle l\'app pour repartir à zéro.');
}

/**
 * Crée le compte de démonstration fourni à App Review. L'inscription normale
 * exige un code de vérification reçu par e-mail : un reviewer ne peut pas le
 * recevoir, donc le compte est créé ici déjà vérifié, avec son pseudo, prêt à
 * se connecter. Le mot de passe n'est JAMAIS écrit dans le repo (public) : il
 * est passé en argument et ne vit que dans App Store Connect.
 */
function createDemo(email, password, pseudo) {
  if (!email || !password || !pseudo)
    return console.error('usage: admin.mjs create-demo <email> <mot-de-passe> <pseudo> --yes');
  if (String(password).length < 8) return console.error('mot de passe : 8 caractères minimum');
  if (!hasYes) { console.error('⚠ Crée un compte utilisateur réel. Ajoute --yes pour confirmer.'); process.exit(1); }
  const normalized = String(email).trim().toLowerCase();
  const db = open(false);
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalized);
  const now = Date.now();
  const { salt, hash } = hashPassword(String(password));
  let userId;
  if (existing) {
    userId = existing.id;
    db.prepare(
      'UPDATE users SET password_hash = ?, password_salt = ?, email_verified = 1, updated_at = ? WHERE id = ?',
    ).run(hash, salt, now, userId);
    console.log('Compte existant : mot de passe réinitialisé et e-mail marqué vérifié.');
  } else {
    userId = randomUUID();
    db.prepare(
      `INSERT INTO users (id, email, password_hash, password_salt, apple_sub, google_sub,
                          created_at, updated_at, email_verified)
       VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, 1)`,
    ).run(userId, normalized, hash, salt, now, now);
  }
  const player = db.prepare('SELECT device_id FROM players WHERE user_id = ?').get(userId);
  const deviceId = player?.device_id ?? randomUUID();
  if (player) db.prepare('UPDATE players SET pseudo = ?, updated_at = ? WHERE device_id = ?').run(pseudo, now, deviceId);
  else db.prepare('INSERT INTO players (device_id, pseudo, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
         .run(deviceId, pseudo, userId, now, now);
  db.close();
  console.log(`✔ Compte de démo prêt : ${normalized} · pseudo ${pseudo} · e-mail vérifié, sans 2FA.`);
  console.log('  Charge une progression avec set-progress pour qu\'il ne soit pas vide.');
}

function confirmReset(what, run) {
  if (!hasYes) { console.error(`⚠ ${what} — action destructrice. Ajoute --yes pour confirmer.`); process.exit(1); }
  const db = open(false);
  const n = run(db);
  db.close();
  console.log(`✔ ${what} : ${n} ligne(s) affectée(s).`);
}

const COMMANDS = {
  stats,
  players,
  user: () => user(args[0]),
  'set-progress': () => setProgress(args[0], args[1]),
  'clear-progress': () => clearProgress(args[0]),
  'create-demo': () => createDemo(args[0], args[1], args[2]),
  'reset-xp': () => confirmReset('Réinitialisation de l\'XP/classement (daily_xp)', (db) => db.prepare('DELETE FROM daily_xp').run().changes),
  'reset-ranks': () => confirmReset('Réinitialisation des rangs (players.rank)', (db) => db.prepare('UPDATE players SET rank = NULL').run().changes),
  'reset-all': () => confirmReset('Réinitialisation XP + rangs', (db) => {
    const a = db.prepare('DELETE FROM daily_xp').run().changes;
    const b = db.prepare('UPDATE players SET rank = NULL').run().changes;
    return a + b;
  }),
  // Suppression COMPLÈTE des utilisateurs : comptes + joueurs + XP + codes liés.
  // Repart d'un backend vierge. Ne touche pas error_reports (diagnostics).
  'wipe-users': () => confirmReset('Suppression de tous les utilisateurs (comptes + joueurs + XP + sauvegardes)', (db) => {
    let n = 0;
    // `progress` = sauvegarde cloud liée au compte : la vider évite qu'une
    // progression survive à la suppression du compte (ou qu'un nouveau compte
    // réutilisant un id hérite d'une ancienne sauvegarde).
    for (const table of ['daily_xp', 'reset_codes', 'email_verifications', 'progress', 'players', 'users']) {
      n += db.prepare(`DELETE FROM ${table}`).run().changes;
    }
    return n;
  }),
};

const fn = COMMANDS[cmd];
if (!fn) {
  console.log('Commandes : stats | players | user <pseudo|email> | set-progress <pseudo> <fichier.json> --yes |');
  console.log('            clear-progress <pseudo> --yes | create-demo <email> <mdp> <pseudo> --yes |');
  console.log('            reset-xp --yes | reset-ranks --yes | reset-all --yes | wipe-users --yes');
  process.exit(cmd ? 1 : 0);
}
fn();
