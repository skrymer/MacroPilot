import type { SqlDatabase } from './SqlDatabase';

/**
 * Every table, whichever store is called first. AUTOINCREMENT, so an id is never used again after a
 * delete. A food's macros are grams per 100 g, and NULL is not stated, which is not zero. A phone's
 * engine holds to its keys only where it is told to, on each connection.
 *
 * Nothing is migrated in development (ADR 0008): after a change here, the app is deleted from the
 * phone before it is installed again.
 */
const SCHEMA = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    protein REAL NOT NULL,
    carbohydrate REAL NOT NULL,
    fat REAL NOT NULL,
    fibre REAL,
    alcohol REAL
  );
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    food_id INTEGER NOT NULL REFERENCES foods (id),
    grams REAL NOT NULL,
    calories REAL NOT NULL,
    protein REAL NOT NULL
  );
  CREATE INDEX IF NOT EXISTS entries_by_day ON entries (day);
`;

/** Made on every call rather than once, so a call after one that failed can succeed. */
export async function withSchema(db: SqlDatabase): Promise<SqlDatabase> {
  await db.execAsync(SCHEMA);
  return db;
}
