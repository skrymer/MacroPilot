import type { Goal } from '@/domain/goal';

import type { GoalStore } from './GoalStore';
import { withSchema } from './schema';
import type { SqlDatabase } from './SqlDatabase';

type Row = { set_on: string; start_kg: number; target_kg: number; rate_kg_a_week: number };

export class SqliteGoalStore implements GoalStore {
  constructor(private readonly db: SqlDatabase) {}

  async read(): Promise<Goal | undefined> {
    const db = await withSchema(this.db);
    const [row] = await db.getAllAsync<Row>('SELECT * FROM goal WHERE id = 1', []);
    if (row === undefined) return undefined;
    return {
      setOn: row.set_on,
      startKg: row.start_kg,
      targetKg: row.target_kg,
      rateKgPerWeek: row.rate_kg_a_week,
    };
  }

  async save({ setOn, startKg, targetKg, rateKgPerWeek }: Goal): Promise<void> {
    const db = await withSchema(this.db);
    await db.runAsync(
      'INSERT OR REPLACE INTO goal (id, set_on, start_kg, target_kg, rate_kg_a_week) VALUES (1, ?, ?, ?, ?)',
      [setOn, startKg, targetKg, rateKgPerWeek],
    );
  }
}
