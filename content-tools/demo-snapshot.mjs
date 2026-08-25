#!/usr/bin/env node
/**
 * Construit un snapshot de progression « vitrine » à partir du contenu réel du
 * repo. Sert à préparer un compte de démonstration pour les captures App Store
 * et la fiche de test App Review : rang, série, XP, leçons faites, pratique
 * terminée, questions à réviser.
 *
 * Le snapshot respecte le format de src/features/sync/merge.ts. Il s'applique
 * via l'API (PUT /v1/progress) ou côté serveur :
 *   node content-tools/demo-snapshot.mjs > /tmp/demo.json
 *   scp /tmp/demo.json mateobrl:/tmp/
 *   ssh mateobrl 'node --experimental-sqlite /opt/pentaguin-api/admin.mjs \
 *     set-progress <pseudo> /tmp/demo.json --yes'
 *
 * Options : --rank=9 --streak=12 --xp=4820 --pack=secplus-sy0-701
 */
import fs from 'node:fs';
import path from 'node:path';

const arg = (name, dflt) => {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : dflt;
};
const PACK = arg('pack', 'secplus-sy0-701');
const RANK = Number(arg('rank', 9)); // 9 = Or I
const STREAK = Number(arg('streak', 12));
const TARGET_XP = Number(arg('xp', 4820));
const ROOT = path.join(import.meta.dirname, '..');
const PACK_DIR = path.join(ROOT, 'src/content/packs', PACK);

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const listIn = (dir, key) => {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const j = readJson(path.join(dir, f));
    out.push(...(Array.isArray(j) ? j : (j[key] ?? [])));
  }
  return out;
};

const lessons = listIn(path.join(PACK_DIR, 'lessons'), 'lessons');
const questions = listIn(path.join(PACK_DIR, 'questions'), 'questions');
const practice = readJson(path.join(ROOT, 'src/content/practice/exercises.json'));
const missions = readJson(path.join(ROOT, 'src/content/practice/missions.json'));
const exList = practice.exercises ?? practice;
const misList = missions.missions ?? missions;

const DAY = 86_400_000;
const dayKey = (offset) => new Date(Date.now() - offset * DAY).toISOString().slice(0, 10);
// Générateur déterministe : même snapshot à chaque exécution.
let seed = 1337;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = (arr, n) => arr.filter(() => rnd() < n / arr.length);

const snap = { v: 1, lessons: {}, qstats: {}, activity: {}, kv: {}, reviews: {} };

// Activité : la série demandée jusqu'à aujourd'hui, puis un historique troué.
const days = [];
for (let i = 0; i < STREAK; i += 1) days.push(dayKey(i));
for (let i = STREAK + 1; i < 75; i += 1) if (rnd() < 0.55) days.push(dayKey(i));
const base = Math.floor(TARGET_XP / days.length);
days.forEach((d, i) => {
  snap.activity[d] = i === 0 ? 30 : base + Math.floor(rnd() * 22);
});
// Ajustement pour tomber sur le total visé, sans toucher au jour courant.
let total = Object.values(snap.activity).reduce((a, b) => a + b, 0);
const older = days.slice(1);
let k = 0;
while (total !== TARGET_XP && older.length) {
  const d = older[k % older.length];
  const step = total < TARGET_XP ? 1 : -1;
  if (snap.activity[d] + step > 0) {
    snap.activity[d] += step;
    total += step;
  }
  k += 1;
}

// Leçons : environ deux tiers du catalogue.
const doneLessons = lessons.filter((_, i) => i % 3 !== 2);
doneLessons.forEach((l, i) => {
  snap.lessons[`${PACK}::${l.id}`] = Date.now() - (i % 60) * DAY;
});

// Questions : vues avec un taux de réussite crédible, plus des révisions dues.
const seen = questions.filter(() => rnd() < 0.78);
seen.forEach((q, i) => {
  const ok = rnd() < 0.84 ? 1 : 0;
  const lastSeen = Date.now() - (i % 40) * DAY;
  snap.qstats[`${PACK}::${q.id}`] = [1 + (rnd() < 0.3 ? 1 : 0), ok, lastSeen, ok ? 0 : lastSeen];
});
// 7 révisions arrivent à échéance aujourd'hui, le reste plus tard.
const dueToday = seen.slice(0, 7);
dueToday.forEach((q) => {
  snap.reviews[`${PACK}::${q.id}`] = [dayKey(0), 7, 2];
});
seen.slice(7, 90).forEach((q, i) => {
  snap.reviews[`${PACK}::${q.id}`] = [dayKey(-(2 + (i % 30))), 16, 3];
});

// Pratique et missions : entamées, pas terminées (une capture doit montrer du reste à faire).
pick(exList, Math.round(exList.length * 0.6)).forEach((ex) => {
  snap.kv[`practice_done:${ex.id}`] = '1';
});
misList.slice(0, 5).forEach((m) => {
  snap.kv[`mission_done:${m.id}`] = '1';
});

snap.kv.player_rank = String(RANK);
snap.kv.streak = String(STREAK);
snap.kv.streak_freezes = '2';
snap.kv.streak_celebrated = '7';
snap.kv.daily_goal_level = 'normal';
snap.kv.upsell_shown_count = '1';

process.stdout.write(JSON.stringify(snap));
process.stderr.write(
  `snapshot: rang ${RANK}, série ${STREAK} j, ${total} XP, ` +
    `${Object.keys(snap.lessons).length}/${lessons.length} leçons, ` +
    `${Object.keys(snap.qstats).length}/${questions.length} questions, ` +
    `${Object.keys(snap.reviews).length} révisions\n`,
);
