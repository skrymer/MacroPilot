import type { Review } from '@/domain/review';

import type { ReviewStore } from './ReviewStore';
import { withSchema } from './schema';
import type { SqlDatabase } from './SqlDatabase';

type Row = {
  day: string;
  trend_kg: number;
  maintenance_kcal: number;
  budget_kcal: number;
  protein_floor_g: number;
};

export class SqliteReviewStore implements ReviewStore {
  constructor(private readonly db: SqlDatabase) {}

  async save(review: Review): Promise<void> {
    const db = await withSchema(this.db);
    // Both or neither: a save that fails between the two has changed nothing.
    await db.withTransactionAsync(async (tx) => {
      await tx.runAsync(
        'INSERT OR REPLACE INTO reviews (day, trend_kg, maintenance_kcal, budget_kcal, protein_floor_g) VALUES (?, ?, ?, ?, ?)',
        [
          review.day,
          review.trendKg,
          review.maintenanceKcal,
          review.budgetKcal,
          review.proteinFloorG,
        ],
      );
      await tx.runAsync('DELETE FROM reviews WHERE day > ?', [review.day]);
    });
  }

  async list(): Promise<Review[]> {
    const db = await withSchema(this.db);
    const rows = await db.getAllAsync<Row>('SELECT * FROM reviews ORDER BY day', []);
    return rows.map((row) => ({
      day: row.day,
      trendKg: row.trend_kg,
      maintenanceKcal: row.maintenance_kcal,
      budgetKcal: row.budget_kcal,
      proteinFloorG: row.protein_floor_g,
    }));
  }
}
