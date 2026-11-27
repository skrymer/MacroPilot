import type { Profile } from '@/domain/profile';

import type { ProfileStore } from './ProfileStore';
import { withSchema } from './schema';
import type { SqlDatabase } from './SqlDatabase';

type Row = {
  sex: Profile['sex'];
  born: string;
  height_cm: number;
  counts_calories: number;
};

export class SqliteProfileStore implements ProfileStore {
  constructor(private readonly db: SqlDatabase) {}

  async read(): Promise<Profile | undefined> {
    const db = await withSchema(this.db);
    const [row] = await db.getAllAsync<Row>('SELECT * FROM profile WHERE id = 1', []);
    if (row === undefined) return undefined;
    const { sex, born, height_cm, counts_calories } = row;
    return { sex, born, heightCm: height_cm, countsCalories: counts_calories === 1 };
  }

  async save({ sex, born, heightCm, countsCalories }: Profile): Promise<void> {
    const db = await withSchema(this.db);
    await db.runAsync(
      'INSERT OR REPLACE INTO profile (id, sex, born, height_cm, counts_calories) VALUES (1, ?, ?, ?, ?)',
      [sex, born, heightCm, countsCalories ? 1 : 0],
    );
  }
}
