/**
 * API Pentaguin — classement (v1.1) + comptes (v1.2).
 *
 * Zéro dépendance npm : Node 22+ (node:http, node:sqlite, node:crypto).
 * Déploiement : backend/deploy/deploy.sh (rsync + systemctl restart).
 *
 * Comptes = identité de classement uniquement (choix produit) : un compte
 * (email+mdp, Apple ou Google) sécurise le pseudo/score et permet de les
 * retrouver sur un autre appareil. Aucune autre donnée. Le compte est
 * optionnel — l'app fonctionne intégralement sans.
 *
 * Secrets (jamais dans le repo, public) : /etc/pentaguin/env via systemd
 * EnvironmentFile — JWT_SECRET (sessions), GOOGLE_CLIENT_IDS (aud OAuth).
 */
import { spawn } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';

import {
  hashPassword,
  signSession,
  verifyIdentityToken,
  verifyPassword,
  verifySession,
} from './auth.mjs';

const PORT = Number(process.env.PORT ?? 3002);
const DB_PATH = process.env.DB_PATH ?? '/var/lib/pentaguin/pentaguin.db';
const JWT_SECRET = process.env.JWT_SECRET ?? '';
const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID ?? 'fr.mateobrl.pentaguin';
const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const MAIL_FROM = process.env.MAIL_FROM ?? 'pentaguin@mateobrl.fr';
const SENDMAIL = '/usr/sbin/sendmail';

// — garde-fous anti-abus --------------------------------------------------------
const MAX_BODY_BYTES = 64 * 1024;
const MAX_XP_PER_DAY = 2000;
const MAX_DAYS_PER_SYNC = 60;
const RATE_LIMIT_PER_MIN = 60;
const AUTH_RATE_LIMIT_PER_MIN = 10;
const LEADERBOARD_SIZE = 50;
const RESET_CODE_TTL_MS = 15 * 60_000;

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS players (
    device_id  TEXT PRIMARY KEY,
    pseudo     TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS daily_xp (
    device_id TEXT NOT NULL REFERENCES players(device_id),
    date      TEXT NOT NULL,
    xp        INTEGER NOT NULL,
    PRIMARY KEY (device_id, date)
  );
  CREATE INDEX IF NOT EXISTS idx_daily_xp_date ON daily_xp(date);
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE,
    password_hash TEXT,
    password_salt TEXT,
    apple_sub     TEXT UNIQUE,
    google_sub    TEXT UNIQUE,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reset_codes (
    email      TEXT PRIMARY KEY,
    code_hash  TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);
try {
  db.exec('ALTER TABLE players ADD COLUMN user_id TEXT');
} catch {
  // colonne déjà présente
}

// — requêtes préparées -----------------------------------------------------------
const upsertPlayer = db.prepare(`
  INSERT INTO players (device_id, pseudo, created_at, updated_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(device_id) DO UPDATE SET pseudo = excluded.pseudo, updated_at = excluded.updated_at
`);
const upsertDay = db.prepare(`
  INSERT INTO daily_xp (device_id, date, xp) VALUES (?, ?, ?)
  ON CONFLICT(device_id, date) DO UPDATE SET xp = MAX(daily_xp.xp, excluded.xp)
`);
const leaderboardAll = db.prepare(`
  SELECT p.pseudo, SUM(d.xp) AS xp
  FROM players p JOIN daily_xp d ON d.device_id = p.device_id
  GROUP BY p.device_id ORDER BY xp DESC LIMIT ?
`);
const leaderboardSince = db.prepare(`
  SELECT p.pseudo, SUM(d.xp) AS xp
  FROM players p JOIN daily_xp d ON d.device_id = p.device_id
  WHERE d.date >= ?
  GROUP BY p.device_id ORDER BY xp DESC LIMIT ?
`);
const selectUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const selectUserById = db.prepare('SELECT * FROM users WHERE id = ?');
const selectUserByAppleSub = db.prepare('SELECT * FROM users WHERE apple_sub = ?');
const selectUserByGoogleSub = db.prepare('SELECT * FROM users WHERE google_sub = ?');
const insertUser = db.prepare(`
  INSERT INTO users (id, email, password_hash, password_salt, apple_sub, google_sub, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const updatePassword = db.prepare(
  'UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?',
);
const selectPlayerByUser = db.prepare('SELECT device_id, pseudo FROM players WHERE user_id = ?');
const selectPlayerByDevice = db.prepare(
  'SELECT device_id, user_id FROM players WHERE device_id = ?',
);
const claimPlayer = db.prepare(
  'UPDATE players SET user_id = ?, updated_at = ? WHERE device_id = ? AND user_id IS NULL',
);
const insertPlayer = db.prepare(
  'INSERT INTO players (device_id, pseudo, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
);
const sumXpByDevice = db.prepare(
  'SELECT COALESCE(SUM(xp), 0) AS total FROM daily_xp WHERE device_id = ?',
);
const upsertResetCode = db.prepare(`
  INSERT INTO reset_codes (email, code_hash, expires_at) VALUES (?, ?, ?)
  ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at
`);
const selectResetCode = db.prepare('SELECT * FROM reset_codes WHERE email = ?');
const deleteResetCode = db.prepare('DELETE FROM reset_codes WHERE email = ?');

// — validation --------------------------------------------------------------------
const isDeviceId = (value) => typeof value === 'string' && /^[0-9a-f-]{16,64}$/i.test(value);
const isPseudo = (value) => typeof value === 'string' && /^[\p{L}\p{N} _.-]{3,20}$/u.test(value.trim());
const isDateKey = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isEmail = (value) =>
  typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
const isPassword = (value) => typeof value === 'string' && value.length >= 8 && value.length <= 128;

// — rate limit en mémoire par IP ----------------------------------------------------
function makeBucket(limitPerMin) {
  const buckets = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of buckets) if (now > bucket.reset) buckets.delete(ip);
  }, 300_000).unref();
  return (ip) => {
    const now = Date.now();
    const bucket = buckets.get(ip);
    if (!bucket || now > bucket.reset) {
      buckets.set(ip, { count: 1, reset: now + 60_000 });
      return false;
    }
    bucket.count += 1;
    return bucket.count > limitPerMin;
  };
}
const rateLimited = makeBucket(RATE_LIMIT_PER_MIN);
const authRateLimited = makeBucket(AUTH_RATE_LIMIT_PER_MIN);

// — helpers HTTP ---------------------------------------------------------------------
function send(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function requireJson(req, res) {
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('application/json')) {
    send(res, 415, { error: 'Content-Type application/json requis' });
    return false;
  }
  return true;
}

function dateKeyDaysAgo(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

function authUserId(req) {
  if (!JWT_SECRET) return null;
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) return null;
  const claims = verifySession(header.slice(7), JWT_SECRET);
  if (!claims) return null;
  return selectUserById.get(claims.sub) ? claims.sub : null;
}

/** Résout (ou crée) la ligne joueur d'un compte ; peut absorber un deviceId anonyme. */
function resolveAccountPlayer(userId, deviceId) {
  const owned = selectPlayerByUser.get(userId);
  if (owned) return owned.device_id;
  const now = Date.now();
  if (deviceId) {
    const existing = selectPlayerByDevice.get(deviceId);
    if (existing && !existing.user_id) {
      claimPlayer.run(userId, now, deviceId);
      return deviceId;
    }
  }
  const freshId = deviceId && !selectPlayerByDevice.get(deviceId) ? deviceId : randomUUID();
  // Pseudo vide = « pas encore choisi » : l'app force l'écran de choix du pseudo
  // après l'inscription (obligatoire). Un joueur sans pseudo n'a jamais de XP
  // (l'app est verrouillée avant le choix) donc n'apparaît pas au classement.
  insertPlayer.run(freshId, '', userId, now, now);
  return freshId;
}

const updatePlayerPseudo = db.prepare(
  'UPDATE players SET pseudo = ?, updated_at = ? WHERE device_id = ?',
);

function sendMail(to, subject, text) {
  return new Promise((resolve, reject) => {
    const proc = spawn(SENDMAIL, ['-t']);
    proc.on('error', reject);
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`sendmail_${code}`))));
    proc.stdin.end(
      `To: ${to}\nFrom: Pentaguin <${MAIL_FROM}>\nSubject: Code de reinitialisation Pentaguin\nContent-Type: text/plain; charset=utf-8\n\n${text}\n`,
    );
  });
}
const mailAvailable = existsSync(SENDMAIL);

// — routes ------------------------------------------------------------------------

function handleLeaderboard(res, url) {
  const period = url.searchParams.get('period') === '7d' ? '7d' : 'all';
  const rows =
    period === '7d'
      ? leaderboardSince.all(dateKeyDaysAgo(6), LEADERBOARD_SIZE)
      : leaderboardAll.all(LEADERBOARD_SIZE);
  send(res, 200, {
    period,
    entries: rows.map((row, index) => ({ rank: index + 1, pseudo: row.pseudo, xp: row.xp })),
  });
}

async function handleSync(req, res) {
  if (!requireJson(req, res)) return;
  const body = await readJson(req);
  const { deviceId, pseudo, days } = body ?? {};
  if (!isPseudo(pseudo)) return send(res, 400, { error: 'pseudo invalide (3-20 caractères)' });
  if (!Array.isArray(days) || days.length > MAX_DAYS_PER_SYNC)
    return send(res, 400, { error: 'days invalide' });
  for (const day of days) {
    if (!isDateKey(day?.date) || !Number.isInteger(day?.xp) || day.xp < 0)
      return send(res, 400, { error: 'entrée de jour invalide' });
  }

  const userId = authUserId(req);
  let key;
  if (userId) {
    key = resolveAccountPlayer(userId, isDeviceId(deviceId) ? deviceId : null);
  } else {
    if (!isDeviceId(deviceId)) return send(res, 400, { error: 'deviceId invalide' });
    const existing = selectPlayerByDevice.get(deviceId);
    if (existing?.user_id)
      return send(res, 403, { error: 'identité liée à un compte : connexion requise' });
    key = deviceId;
  }

  const now = Date.now();
  upsertPlayer.run(key, pseudo.trim(), now, now);
  for (const day of days) upsertDay.run(key, day.date, Math.min(day.xp, MAX_XP_PER_DAY));
  send(res, 200, { ok: true });
}

function issueSession(res, user) {
  send(res, 200, { token: signSession(user.id, JWT_SECRET), email: user.email ?? null });
}

async function handleRegister(req, res) {
  if (!requireJson(req, res)) return;
  const { email, password, deviceId } = (await readJson(req)) ?? {};
  if (!isEmail(email)) return send(res, 400, { error: 'email invalide' });
  if (!isPassword(password))
    return send(res, 400, { error: 'mot de passe invalide (8 caractères minimum)' });
  const normalized = email.trim().toLowerCase();
  if (selectUserByEmail.get(normalized)) return send(res, 409, { error: 'email déjà utilisé' });

  const { salt, hash } = hashPassword(password);
  const now = Date.now();
  const id = randomUUID();
  insertUser.run(id, normalized, hash, salt, null, null, now, now);
  resolveAccountPlayer(id, isDeviceId(deviceId) ? deviceId : null);
  issueSession(res, { id, email: normalized });
}

async function handleLogin(req, res) {
  if (!requireJson(req, res)) return;
  const { email, password, deviceId } = (await readJson(req)) ?? {};
  if (!isEmail(email) || typeof password !== 'string')
    return send(res, 401, { error: 'identifiants invalides' });
  const user = selectUserByEmail.get(email.trim().toLowerCase());
  if (!user?.password_hash || !verifyPassword(password, user.password_salt, user.password_hash))
    return send(res, 401, { error: 'identifiants invalides' });
  resolveAccountPlayer(user.id, isDeviceId(deviceId) ? deviceId : null);
  issueSession(res, user);
}

async function handleOAuth(req, res, provider) {
  if (!requireJson(req, res)) return;
  const body = (await readJson(req)) ?? {};
  const rawToken = provider === 'apple' ? body.identityToken : body.idToken;
  if (typeof rawToken !== 'string') return send(res, 400, { error: 'token manquant' });

  let payload = null;
  if (provider === 'apple') {
    payload = await verifyIdentityToken(rawToken, {
      jwksUrl: 'https://appleid.apple.com/auth/keys',
      issuers: ['https://appleid.apple.com'],
      audiences: [APPLE_BUNDLE_ID],
    });
  } else {
    if (GOOGLE_CLIENT_IDS.length === 0)
      return send(res, 503, { error: 'connexion Google non configurée' });
    payload = await verifyIdentityToken(rawToken, {
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
      issuers: ['https://accounts.google.com', 'accounts.google.com'],
      audiences: GOOGLE_CLIENT_IDS,
    });
  }
  if (!payload?.sub) return send(res, 401, { error: 'token invalide' });

  const bySub = provider === 'apple' ? selectUserByAppleSub : selectUserByGoogleSub;
  let user = bySub.get(payload.sub);
  if (!user) {
    const now = Date.now();
    const id = randomUUID();
    const email =
      typeof payload.email === 'string' && !selectUserByEmail.get(payload.email.toLowerCase())
        ? payload.email.toLowerCase()
        : null;
    insertUser.run(
      id,
      email,
      null,
      null,
      provider === 'apple' ? payload.sub : null,
      provider === 'google' ? payload.sub : null,
      now,
      now,
    );
    user = { id, email };
  }
  resolveAccountPlayer(user.id, isDeviceId(body.deviceId) ? body.deviceId : null);
  issueSession(res, user);
}

function handleMe(req, res) {
  const userId = authUserId(req);
  if (!userId) return send(res, 401, { error: 'non connecté' });
  const user = selectUserById.get(userId);
  const player = selectPlayerByUser.get(userId);
  const xpTotal = player ? sumXpByDevice.get(player.device_id).total : 0;
  send(res, 200, {
    email: user.email ?? null,
    providers: [
      user.password_hash ? 'email' : null,
      user.apple_sub ? 'apple' : null,
      user.google_sub ? 'google' : null,
    ].filter(Boolean),
    pseudo: player?.pseudo ?? null,
    xpTotal,
  });
}

async function handleSetPseudo(req, res) {
  if (!requireJson(req, res)) return;
  const userId = authUserId(req);
  if (!userId) return send(res, 401, { error: 'non connecté' });
  const { pseudo } = (await readJson(req)) ?? {};
  if (!isPseudo(pseudo)) return send(res, 400, { error: 'pseudo invalide (3-20 caractères)' });
  // resolveAccountPlayer garantit la présence d'une ligne joueur pour ce compte.
  const deviceId = resolveAccountPlayer(userId, null);
  updatePlayerPseudo.run(pseudo.trim(), Date.now(), deviceId);
  send(res, 200, { ok: true, pseudo: pseudo.trim() });
}

function handleDeleteMe(req, res) {
  const userId = authUserId(req);
  if (!userId) return send(res, 401, { error: 'non connecté' });
  const user = selectUserById.get(userId);
  const players = db.prepare('SELECT device_id FROM players WHERE user_id = ?').all(userId);
  for (const player of players) {
    db.prepare('DELETE FROM daily_xp WHERE device_id = ?').run(player.device_id);
    db.prepare('DELETE FROM players WHERE device_id = ?').run(player.device_id);
  }
  if (user.email) deleteResetCode.run(user.email);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  send(res, 200, { ok: true });
}

async function handleResetRequest(req, res) {
  if (!requireJson(req, res)) return;
  const { email } = (await readJson(req)) ?? {};
  // Réponse identique que l'email existe ou non (pas d'énumération de comptes).
  if (isEmail(email) && mailAvailable) {
    const user = selectUserByEmail.get(email.trim().toLowerCase());
    if (user?.password_hash) {
      const code = String(randomBytes(4).readUInt32BE() % 1_000_000).padStart(6, '0');
      const codeHash = createHash('sha256').update(code).digest('hex');
      upsertResetCode.run(user.email, codeHash, Date.now() + RESET_CODE_TTL_MS);
      sendMail(
        user.email,
        'Code de reinitialisation Pentaguin',
        `Ton code de réinitialisation Pentaguin : ${code}\nIl expire dans 15 minutes. Si tu n'es pas à l'origine de cette demande, ignore ce message.`,
      ).catch(() => {});
    }
  }
  send(res, 200, { ok: true });
}

async function handleReset(req, res) {
  if (!requireJson(req, res)) return;
  const { email, code, newPassword } = (await readJson(req)) ?? {};
  if (!isEmail(email) || typeof code !== 'string' || !isPassword(newPassword))
    return send(res, 400, { error: 'requête invalide' });
  const normalized = email.trim().toLowerCase();
  const entry = selectResetCode.get(normalized);
  const codeHash = createHash('sha256').update(code).digest('hex');
  if (!entry || entry.expires_at < Date.now() || entry.code_hash !== codeHash)
    return send(res, 401, { error: 'code invalide ou expiré' });
  const user = selectUserByEmail.get(normalized);
  if (!user) return send(res, 401, { error: 'code invalide ou expiré' });
  const { salt, hash } = hashPassword(newPassword);
  updatePassword.run(hash, salt, Date.now(), user.id);
  deleteResetCode.run(normalized);
  send(res, 200, { ok: true });
}

// — serveur ------------------------------------------------------------------------

const AUTH_ROUTES = new Set([
  '/v1/auth/register',
  '/v1/auth/login',
  '/v1/auth/apple',
  '/v1/auth/google',
  '/v1/auth/reset-request',
  '/v1/auth/reset',
]);

const server = createServer(async (req, res) => {
  const ip = req.headers['x-real-ip'] ?? req.socket.remoteAddress ?? 'unknown';
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (AUTH_ROUTES.has(url.pathname)) {
    if (authRateLimited(ip)) return send(res, 429, { error: 'trop de requêtes' });
    if (!JWT_SECRET) return send(res, 503, { error: 'authentification non configurée' });
  } else if (rateLimited(ip)) {
    return send(res, 429, { error: 'trop de requêtes' });
  }

  try {
    if (req.method === 'GET' && url.pathname === '/healthz') return send(res, 200, { ok: true });
    if (req.method === 'GET' && url.pathname === '/v1/leaderboard')
      return handleLeaderboard(res, url);
    if (req.method === 'POST' && url.pathname === '/v1/sync') return await handleSync(req, res);
    if (req.method === 'POST' && url.pathname === '/v1/auth/register')
      return await handleRegister(req, res);
    if (req.method === 'POST' && url.pathname === '/v1/auth/login')
      return await handleLogin(req, res);
    if (req.method === 'POST' && url.pathname === '/v1/auth/apple')
      return await handleOAuth(req, res, 'apple');
    if (req.method === 'POST' && url.pathname === '/v1/auth/google')
      return await handleOAuth(req, res, 'google');
    if (req.method === 'GET' && url.pathname === '/v1/me') return handleMe(req, res);
    if (req.method === 'POST' && url.pathname === '/v1/me/pseudo')
      return await handleSetPseudo(req, res);
    if (req.method === 'DELETE' && url.pathname === '/v1/me') return handleDeleteMe(req, res);
    if (req.method === 'POST' && url.pathname === '/v1/auth/reset-request')
      return await handleResetRequest(req, res);
    if (req.method === 'POST' && url.pathname === '/v1/auth/reset')
      return await handleReset(req, res);
    send(res, 404, { error: 'introuvable' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erreur';
    send(res, message === 'body_too_large' || message === 'invalid_json' ? 400 : 500, {
      error: message,
    });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(
    `API Pentaguin sur 127.0.0.1:${PORT} (db: ${DB_PATH}, auth: ${JWT_SECRET ? 'active' : 'INACTIVE'}, mail: ${mailAvailable})`,
  );
});
