import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { migrations } from './migrations';

let instance: SQLiteDatabase | null = null;

/** Ouvre la base (et applique les migrations) au premier accès. */
export function getDb(): SQLiteDatabase {
  if (!instance) {
    const db = openDatabaseSync('pentaguin.db');
    db.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    migrate(db);
    instance = db;
  }
  return instance;
}

function migrate(db: SQLiteDatabase) {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < migrations.length) {
    const nextVersion = version + 1;
    db.withTransactionSync(() => {
      db.execSync(migrations[version]);
      db.execSync(`PRAGMA user_version = ${nextVersion}`);
    });
    version = nextVersion;
  }
}
