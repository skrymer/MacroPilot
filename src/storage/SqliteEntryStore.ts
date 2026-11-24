import type { WeighedEntry } from '@/domain/entry';

import type { EntryStore, LoggedEntry } from './EntryStore';
import { withSchema } from './schema';
import type { SqlDatabase } from './SqlDatabase';

/** An entry takes its name from its food now, and its figures from when it was logged. */
const ON_DAY = `
  SELECT entries.id, day, food_id AS foodId, grams, calories, entries.protein, foods.name
  FROM entries JOIN foods ON foods.id = food_id
  WHERE day = ?
  ORDER BY entries.id
`;

export class SqliteEntryStore implements EntryStore {
  constructor(private readonly db: SqlDatabase) {}

  async add({ day, foodId, grams, calories, protein }: WeighedEntry): Promise<void> {
    const db = await withSchema(this.db);
    await db.runAsync(
      'INSERT INTO entries (day, food_id, grams, calories, protein) VALUES (?, ?, ?, ?, ?)',
      [day, foodId, grams, calories, protein],
    );
  }

  async listOn(day: string): Promise<LoggedEntry[]> {
    const db = await withSchema(this.db);
    return db.getAllAsync<LoggedEntry>(ON_DAY, [day]);
  }
}
