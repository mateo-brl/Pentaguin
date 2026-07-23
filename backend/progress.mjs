/**
 * Fusion de snapshots de progression — miroir exact de src/features/sync/merge.ts.
 * Jamais de régression : union des leçons, max XP/rang/stats, préférences au plus
 * frais (`b`). Le serveur fusionne à chaque PUT : peu importe l'ordre des
 * appareils, rien ne se perd.
 */

export const SNAPSHOT_VERSION = 1;
export const NUMERIC_MAX_KEYS = [
  'player_rank',
  'streak',
  'streak_freezes',
  'streak_celebrated',
  'upsell_shown_count',
];

export function emptySnapshot() {
  return { v: SNAPSHOT_VERSION, lessons: {}, qstats: {}, activity: {}, kv: {} };
}

const asInt = (v) => {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : 0;
};
const keys = (a, b) => new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);

export function mergeSnapshots(a, b) {
  a = normalize(a);
  b = normalize(b);
  const out = emptySnapshot();

  for (const k of keys(a.lessons, b.lessons)) {
    const av = a.lessons[k];
    const bv = b.lessons[k];
    out.lessons[k] = av != null && bv != null ? Math.min(av, bv) : (av ?? bv);
  }
  for (const k of keys(a.qstats, b.qstats)) {
    const x = a.qstats[k] ?? [0, 0, 0, 0];
    const y = b.qstats[k] ?? [0, 0, 0, 0];
    out.qstats[k] = [
      Math.max(x[0] ?? 0, y[0] ?? 0),
      Math.max(x[1] ?? 0, y[1] ?? 0),
      Math.max(x[2] ?? 0, y[2] ?? 0),
      Math.max(x[3] ?? 0, y[3] ?? 0),
    ];
  }
  for (const k of keys(a.activity, b.activity)) {
    out.activity[k] = Math.max(a.activity[k] ?? 0, b.activity[k] ?? 0);
  }
  for (const k of keys(a.kv, b.kv)) {
    out.kv[k] = NUMERIC_MAX_KEYS.includes(k)
      ? String(Math.max(asInt(a.kv[k]), asInt(b.kv[k])))
      : k in b.kv
        ? b.kv[k]
        : a.kv[k];
  }
  return out;
}

/** Tolère un snapshot partiel/malformé venu du réseau. */
function normalize(s) {
  const o = s && typeof s === 'object' ? s : {};
  return {
    lessons: o.lessons && typeof o.lessons === 'object' ? o.lessons : {},
    qstats: o.qstats && typeof o.qstats === 'object' ? o.qstats : {},
    activity: o.activity && typeof o.activity === 'object' ? o.activity : {},
    kv: o.kv && typeof o.kv === 'object' ? o.kv : {},
  };
}
