import type { SqlDatabase } from './SqlDatabase';

/**
 * Every table, whichever store is called first. AUTOINCREMENT, so an id is never used again after a
 * delete. A food's macros are grams per 100 g, and NULL is not stated, which is not zero. A phone's
 * engine holds to its keys only where it is told to, on each connection.
 *
 * An entry is of a food, with its grams, or has a label of its own, and never half of each.
 *
 * There is one profile, in the row whose id is 1.
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
    food_id INTEGER REFERENCES foods (id),
    grams REAL,
    label TEXT,
    calories REAL NOT NULL,
    protein REAL,
    CHECK (
      (label IS NULL AND food_id IS NOT NULL AND grams IS NOT NULL AND protein IS NOT NULL)
      OR (label IS NOT NULL AND food_id IS NULL AND grams IS NULL)
    )
  );
  CREATE INDEX IF NOT EXISTS entries_by_day ON entries (day);
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
    born TEXT NOT NULL,
    height_cm REAL NOT NULL,
    counts_calories INTEGER NOT NULL CHECK (counts_calories IN (0, 1))
  );
  CREATE TABLE IF NOT EXISTS weigh_ins (
    day TEXT PRIMARY KEY,
    kg REAL NOT NULL
  );
`;

/** Made on every call rather than once, so a call after one that failed can succeed. */
export async function withSchema(db: SqlDatabase): Promise<SqlDatabase> {
  await db.execAsync(SCHEMA);
  return db;
}
