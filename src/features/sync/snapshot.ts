import {
  getAllKv,
  getAllLessonProgress,
  getAllQuestionStats,
  getDailyActivity,
  mergeDailyActivity,
  mergeLessonProgress,
  mergeQuestionStat,
  setKv,
} from '@/db/repositories';

import { emptySnapshot, type Snapshot } from './merge';

/**
 * Clés KV synchronisées (progression + préférences transférables). On EXCLUT
 * volontairement le device-local : onboarding_seen, locale_chosen,
 * placement_state, reminders (spécifiques à l'appareil).
 */
const KV_KEYS = new Set([
  'player_rank',
  'daily_goal_level',
  'streak',
  'streak_freezes',
  'streak_frozen_days',
  'streak_goal_earned',
  'streak_celebrated',
  'upsell_shown_count',
  'locale',
  'theme_mode',
]);
const KV_PREFIXES = ['qc_xp:', 'practice_done:', 'mission_done:'];

function syncableKv(key: string): boolean {
  return KV_KEYS.has(key) || KV_PREFIXES.some((p) => key.startsWith(p));
}

/** Capture l'état de progression local sous forme de snapshot. */
export function snapshotFromDb(): Snapshot {
  const snap = emptySnapshot();
  for (const r of getAllLessonProgress()) snap.lessons[`${r.pack_id}::${r.lesson_id}`] = r.completed_at;
  for (const r of getAllQuestionStats())
    snap.qstats[`${r.pack_id}::${r.question_id}`] = [
      r.seen,
      r.correct,
      r.last_seen_at ?? 0,
      r.last_wrong_at ?? 0,
    ];
  for (const r of getDailyActivity()) snap.activity[r.date] = r.xp;
  for (const [k, v] of Object.entries(getAllKv())) if (syncableKv(k)) snap.kv[k] = v;
  return snap;
}

/** Écrit un snapshot (déjà fusionné) dans la base locale, sans régression. */
export function applySnapshot(snap: Snapshot): void {
  for (const [k, at] of Object.entries(snap.lessons)) {
    const [pack, lesson] = k.split('::');
    if (pack && lesson) mergeLessonProgress(pack, lesson, at);
  }
  for (const [k, s] of Object.entries(snap.qstats)) {
    const [pack, q] = k.split('::');
    if (pack && q) mergeQuestionStat(pack, q, s[0], s[1], s[2] || null, s[3] || null);
  }
  for (const [date, xp] of Object.entries(snap.activity)) mergeDailyActivity(date, xp);
  for (const [k, v] of Object.entries(snap.kv)) if (syncableKv(k)) setKv(k, v);
}
