/**
 * Migrations SQLite, une entrée par version (PRAGMA user_version).
 * Ne JAMAIS modifier une migration publiée : en ajouter une nouvelle.
 * Les timestamps sont en epoch ms ; `daily_activity.date` en YYYY-MM-DD local.
 * Ces enregistrements datés sont pensés pour être synchronisables vers le
 * backend classement/stats prévu en v1.1.
 */
export const migrations: string[] = [
  // v1 — schéma initial
  `
  CREATE TABLE lesson_progress (
    pack_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'done',
    completed_at INTEGER NOT NULL,
    PRIMARY KEY (pack_id, lesson_id)
  );

  CREATE TABLE attempt (
    id TEXT PRIMARY KEY,
    pack_id TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('quiz', 'exam')),
    exam_id TEXT,
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    score_pct REAL,
    question_ids TEXT NOT NULL
  );

  CREATE TABLE attempt_answer (
    attempt_id TEXT NOT NULL REFERENCES attempt(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    selected TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    time_ms INTEGER,
    answered_at INTEGER NOT NULL,
    PRIMARY KEY (attempt_id, question_id)
  );

  CREATE TABLE question_stat (
    pack_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    seen INTEGER NOT NULL DEFAULT 0,
    correct INTEGER NOT NULL DEFAULT 0,
    last_seen_at INTEGER,
    last_wrong_at INTEGER,
    PRIMARY KEY (pack_id, question_id)
  );

  CREATE TABLE daily_activity (
    date TEXT PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX idx_attempt_pack ON attempt(pack_id, started_at);
  CREATE INDEX idx_question_stat_wrong ON question_stat(pack_id, last_wrong_at);
  `,
];
