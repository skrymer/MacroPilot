import { isEstimated, type Entry } from '@/domain/entry';

import type { EntryStore, LoggedEntry } from './EntryStore';
import { withSchema } from './schema';
import type { SqlDatabase } from './SqlDatabase';

/** One kind or the other, as the table holds it to. */
type Row = { id: number; day: string; calories: number } & (
  | { label: null; foodId: number; grams: number; protein: number; foodName: string }
  | { label: string; protein: number | null }
);

/** An entry takes its food's name now, and its figures from when it was logged. An estimate has no food. */
const ON_DAY = `
  SELECT entries.id, day, food_id AS foodId, grams, label, calories, entries.protein,
    foods.name AS foodName
  FROM entries LEFT JOIN foods ON foods.id = food_id
  WHERE day = ?
  ORDER BY entries.id
`;

function entryOf(row: Row): LoggedEntry {
  const { id, day, calories } = row;
  if (row.label !== null) {
    const { label, protein } = row;
    return { id, day, label, calories, protein: protein ?? undefined, name: label };
  }
  const { foodId, grams, protein, foodName } = row;
  return { id, day, foodId, grams, calories, protein, name: foodName };
}

export class SqliteEntryStore implements EntryStore {
  constructor(private readonly db: SqlDatabase) {}

  async add(entry: Entry): Promise<void> {
    const db = await withSchema(this.db);
    const { day, calories, protein } = entry;
    const [foodId, grams, label] = isEstimated(entry)
      ? [null, null, entry.label]
      : [entry.foodId, entry.grams, null];
    await db.runAsync(
      'INSERT INTO entries (day, food_id, grams, label, calories, protein) VALUES (?, ?, ?, ?, ?, ?)',
      [day, foodId, grams, label, calories, protein ?? null],
    );
  }

  async listOn(day: string): Promise<LoggedEntry[]> {
    const db = await withSchema(this.db);
    const rows = await db.getAllAsync<Row>(ON_DAY, [day]);
    return rows.map(entryOf);
  }
}
