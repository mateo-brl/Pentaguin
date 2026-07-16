/**
 * API Pentaguin v1.1 — classement (leaderboard) et stats.
 *
 * Volontairement ZÉRO dépendance npm : Node 22+ (node:http + node:sqlite),
 * déploiement = rsync + systemctl restart. Voir backend/README.md.
 *
 * Modèle de données côté app : l'app envoie l'XP par jour (daily_activity,
 * voir src/db/repositories.ts) avec un deviceId anonyme (UUID généré par
 * l'app) et un pseudo choisi par l'utilisateur. Aucune donnée personnelle.
 */
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';

const PORT = Number(process.env.PORT ?? 3002);
const DB_PATH = process.env.DB_PATH ?? '/var/lib/pentaguin/pentaguin.db';

// — garde-fous anti-abus (l'API est publique) --------------------------------
const MAX_BODY_BYTES = 64 * 1024;
const MAX_XP_PER_DAY = 2000; // ~200 bonnes réponses/jour : au-delà, plafonné
const MAX_DAYS_PER_SYNC = 60;
const RATE_LIMIT_PER_MIN = 60;
const LEADERBOARD_SIZE = 50;

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
`);

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

// — validation (sans dépendance) ----------------------------------------------
const isDeviceId = (v) => typeof v === 'string' && /^[0-9a-f-]{16,64}$/i.test(v);
const isPseudo = (v) => typeof v === 'string' && /^[\p{L}\p{N} _.-]{3,20}$/u.test(v.trim());
const isDateKey = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

// — rate limit en mémoire par IP ----------------------------------------------
const buckets = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now > bucket.reset) {
    buckets.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_PER_MIN;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of buckets) if (now > bucket.reset) buckets.delete(ip);
}, 300_000).unref();

// — helpers HTTP ---------------------------------------------------------------
function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
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

function dateKeyDaysAgo(days) {
  const d = new Date(Date.now() - days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

// — routes ----------------------------------------------------------------------
async function handleSync(req, res) {
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('application/json'))
    return send(res, 415, { error: 'Content-Type application/json requis' });
  const body = await readJson(req);
  const { deviceId, pseudo, days } = body ?? {};
  if (!isDeviceId(deviceId)) return send(res, 400, { error: 'deviceId invalide' });
  if (!isPseudo(pseudo)) return send(res, 400, { error: 'pseudo invalide (3-20 caractères)' });
  if (!Array.isArray(days) || days.length > MAX_DAYS_PER_SYNC)
    return send(res, 400, { error: 'days invalide' });
  for (const day of days) {
    if (!isDateKey(day?.date) || !Number.isInteger(day?.xp) || day.xp < 0)
      return send(res, 400, { error: 'entrée de jour invalide' });
  }

  const now = Date.now();
  upsertPlayer.run(deviceId, pseudo.trim(), now, now);
  for (const day of days) {
    upsertDay.run(deviceId, day.date, Math.min(day.xp, MAX_XP_PER_DAY));
  }
  send(res, 200, { ok: true });
}

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

const server = createServer(async (req, res) => {
  const ip = req.headers['x-real-ip'] ?? req.socket.remoteAddress ?? 'unknown';
  if (rateLimited(ip)) return send(res, 429, { error: 'trop de requêtes' });

  const url = new URL(req.url ?? '/', 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/healthz') return send(res, 200, { ok: true });
    if (req.method === 'GET' && url.pathname === '/v1/leaderboard')
      return handleLeaderboard(res, url);
    if (req.method === 'POST' && url.pathname === '/v1/sync') return await handleSync(req, res);
    send(res, 404, { error: 'introuvable' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erreur';
    send(res, message === 'body_too_large' || message === 'invalid_json' ? 400 : 500, {
      error: message,
    });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`API Pentaguin sur 127.0.0.1:${PORT} (db: ${DB_PATH})`);
});
