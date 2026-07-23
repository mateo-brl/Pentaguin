import { getDb } from './index';

export type AttemptMode = 'quiz' | 'exam';

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Clé de jour LOCALE (YYYY-MM-DD) — le streak suit le fuseau de l'utilisateur. */
export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// — Leçons ------------------------------------------------------------------

export function markLessonCompleted(packId: string, lessonId: string): void {
  getDb().runSync(
    `INSERT INTO lesson_progress (pack_id, lesson_id, status, completed_at)
     VALUES (?, ?, 'done', ?)
     ON CONFLICT(pack_id, lesson_id) DO NOTHING`,
    [packId, lessonId, Date.now()],
  );
}

export function getCompletedLessonIds(packId: string): Set<string> {
  const rows = getDb().getAllSync<{ lesson_id: string }>(
    'SELECT lesson_id FROM lesson_progress WHERE pack_id = ?',
    [packId],
  );
  return new Set(rows.map((row) => row.lesson_id));
}

// — Tentatives (quiz / examens) ---------------------------------------------

export function createAttempt(
  packId: string,
  mode: AttemptMode,
  questionIds: string[],
  examId?: string,
): string {
  const id = newId();
  getDb().runSync(
    `INSERT INTO attempt (id, pack_id, mode, exam_id, started_at, question_ids)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, packId, mode, examId ?? null, Date.now(), JSON.stringify(questionIds)],
  );
  return id;
}

export function recordAnswer(
  attemptId: string,
  questionId: string,
  selected: string[],
  isCorrect: boolean,
  timeMs?: number,
): void {
  getDb().runSync(
    `INSERT OR REPLACE INTO attempt_answer
       (attempt_id, question_id, selected, is_correct, time_ms, answered_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [attemptId, questionId, JSON.stringify(selected), isCorrect ? 1 : 0, timeMs ?? null, Date.now()],
  );
}

export function finishAttempt(attemptId: string, scorePct: number): void {
  getDb().runSync('UPDATE attempt SET finished_at = ?, score_pct = ? WHERE id = ?', [
    Date.now(),
    scorePct,
    attemptId,
  ]);
}

// — Stats par question (« mes erreurs », future répétition espacée) ----------

/** Une bonne réponse efface last_wrong_at : « mes erreurs » = dernière réponse fausse. */
export function bumpQuestionStat(packId: string, questionId: string, isCorrect: boolean): void {
  const now = Date.now();
  getDb().runSync(
    `INSERT INTO question_stat (pack_id, question_id, seen, correct, last_seen_at, last_wrong_at)
     VALUES (?, ?, 1, ?, ?, ?)
     ON CONFLICT(pack_id, question_id) DO UPDATE SET
       seen = seen + 1,
       correct = correct + excluded.correct,
       last_seen_at = excluded.last_seen_at,
       last_wrong_at = excluded.last_wrong_at`,
    [packId, questionId, isCorrect ? 1 : 0, now, isCorrect ? null : now],
  );
}

export function getWrongQuestionIds(packId: string): string[] {
  const rows = getDb().getAllSync<{ question_id: string }>(
    `SELECT question_id FROM question_stat
     WHERE pack_id = ? AND last_wrong_at IS NOT NULL
     ORDER BY last_wrong_at DESC`,
    [packId],
  );
  return rows.map((row) => row.question_id);
}

// — Activité quotidienne (streak) ---------------------------------------------

export function addDailyXp(xp: number): void {
  getDb().runSync(
    `INSERT INTO daily_activity (date, xp) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET xp = xp + excluded.xp`,
    [localDateKey(), xp],
  );
}

export function getDailyActivity(): { date: string; xp: number }[] {
  return getDb().getAllSync<{ date: string; xp: number }>(
    'SELECT date, xp FROM daily_activity ORDER BY date',
  );
}

export function getActivityDates(): string[] {
  const rows = getDb().getAllSync<{ date: string }>(
    'SELECT date FROM daily_activity ORDER BY date',
  );
  return rows.map((row) => row.date);
}

export function getTotalXp(): number {
  const row = getDb().getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(xp), 0) AS total FROM daily_activity',
  );
  return row?.total ?? 0;
}

/** XP gagné aujourd'hui (pour l'objectif quotidien). */
export function getTodayXp(): number {
  const row = getDb().getFirstSync<{ xp: number }>(
    'SELECT xp FROM daily_activity WHERE date = ?',
    [localDateKey()],
  );
  return row?.xp ?? 0;
}

// — Clé/valeur ----------------------------------------------------------------

export function getKv(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string }>('SELECT value FROM kv WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function setKv(key: string, value: string): void {
  getDb().runSync(
    'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

// — Synchronisation : lecture/écriture en masse (cloud save) ------------------

export function getAllKv(): Record<string, string> {
  const rows = getDb().getAllSync<{ key: string; value: string }>('SELECT key, value FROM kv');
  const out: Record<string, string> = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

export function getAllLessonProgress(): { pack_id: string; lesson_id: string; completed_at: number }[] {
  return getDb().getAllSync('SELECT pack_id, lesson_id, completed_at FROM lesson_progress');
}

export function getAllQuestionStats(): {
  pack_id: string;
  question_id: string;
  seen: number;
  correct: number;
  last_seen_at: number | null;
  last_wrong_at: number | null;
}[] {
  return getDb().getAllSync(
    'SELECT pack_id, question_id, seen, correct, last_seen_at, last_wrong_at FROM question_stat',
  );
}

/** Fusion locale sans régression : conserve la première complétion. */
export function mergeLessonProgress(packId: string, lessonId: string, completedAt: number): void {
  getDb().runSync(
    `INSERT INTO lesson_progress (pack_id, lesson_id, status, completed_at)
     VALUES (?, ?, 'done', ?)
     ON CONFLICT(pack_id, lesson_id) DO UPDATE SET completed_at = MIN(completed_at, excluded.completed_at)`,
    [packId, lessonId, completedAt],
  );
}

export function mergeQuestionStat(
  packId: string,
  questionId: string,
  seen: number,
  correct: number,
  lastSeen: number | null,
  lastWrong: number | null,
): void {
  getDb().runSync(
    `INSERT INTO question_stat (pack_id, question_id, seen, correct, last_seen_at, last_wrong_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(pack_id, question_id) DO UPDATE SET
       seen = MAX(seen, excluded.seen),
       correct = MAX(correct, excluded.correct),
       last_seen_at = NULLIF(MAX(COALESCE(last_seen_at, 0), COALESCE(excluded.last_seen_at, 0)), 0),
       last_wrong_at = NULLIF(MAX(COALESCE(last_wrong_at, 0), COALESCE(excluded.last_wrong_at, 0)), 0)`,
    [packId, questionId, seen, correct, lastSeen, lastWrong],
  );
}

/** Fusion de l'XP d'un jour : garde le max (jamais de régression). */
export function mergeDailyActivity(date: string, xp: number): void {
  getDb().runSync(
    `INSERT INTO daily_activity (date, xp) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET xp = MAX(xp, excluded.xp)`,
    [date, xp],
  );
}
