import type { WeighIn } from '@/domain/weighIn';

import { withSchema } from './schema';
import type { SqlDatabase } from './SqlDatabase';
import type { WeighInStore } from './WeighInStore';

export class SqliteWeighInStore implements WeighInStore {
  constructor(private readonly db: SqlDatabase) {}

  async save({ day, kg }: WeighIn): Promise<void> {
    const db = await withSchema(this.db);
    await db.runAsync('INSERT OR REPLACE INTO weigh_ins (day, kg) VALUES (?, ?)', [day, kg]);
  }

  async list(): Promise<WeighIn[]> {
    const db = await withSchema(this.db);
    return db.getAllAsync<WeighIn>('SELECT day, kg FROM weigh_ins ORDER BY day', []);
  }
}
