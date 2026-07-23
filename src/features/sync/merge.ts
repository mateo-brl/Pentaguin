/**
 * Sauvegarde de progression (« cloud save ») : format de snapshot et fusion.
 *
 * Règle d'or : la fusion ne fait JAMAIS régresser une progression. On prend
 * l'union des leçons faites, le max de l'XP/rang/stats. Pour les préférences
 * (langue, thème, objectif), c'est le snapshot le plus frais (`b`) qui gagne.
 * La même logique tourne côté serveur (backend/progress.mjs) : peu importe
 * l'ordre des appareils, rien ne se perd.
 */

export type Snapshot = {
  v: number;
  /** "packId::lessonId" -> date de complétion (epoch ms). */
  lessons: Record<string, number>;
  /** "packId::questionId" -> [seen, correct, lastSeenAt, lastWrongAt]. */
  qstats: Record<string, [number, number, number, number]>;
  /** "YYYY-MM-DD" -> XP du jour. */
  activity: Record<string, number>;
  /** Clés de progression whitelistées (rang, séries, objectif, flags…). */
  kv: Record<string, string>;
};

export const SNAPSHOT_VERSION = 1;

/** Clés KV numériques fusionnées par MAX (jamais de régression). */
export const NUMERIC_MAX_KEYS = [
  'player_rank',
  'streak',
  'streak_freezes',
  'streak_celebrated',
  'upsell_shown_count',
];

export function emptySnapshot(): Snapshot {
  return { v: SNAPSHOT_VERSION, lessons: {}, qstats: {}, activity: {}, kv: {} };
}

const asInt = (v?: string): number => {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : 0;
};

const keys = (a: object, b: object): Set<string> =>
  new Set([...Object.keys(a), ...Object.keys(b)]);

/** Fusionne deux snapshots sans jamais régresser. `b` = le plus frais. */
export function mergeSnapshots(a: Snapshot, b: Snapshot): Snapshot {
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
      Math.max(x[0], y[0]),
      Math.max(x[1], y[1]),
      Math.max(x[2], y[2]),
      Math.max(x[3], y[3]),
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
