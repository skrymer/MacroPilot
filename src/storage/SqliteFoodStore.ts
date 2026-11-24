import { inNameOrder, newFood, type Food, type NewFood } from '@/domain/food';

import type { FoodStore } from './FoodStore';
import type { SqlDatabase } from './SqlDatabase';

/**
 * Macros are grams per 100 g, and NULL is not stated, which is not zero. AUTOINCREMENT, so an id is
 * never used again after a delete.
 *
 * Nothing is migrated in development (ADR 0008): after a change here, the app is deleted from the
 * phone before it is installed again.
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    protein REAL NOT NULL,
    carbohydrate REAL NOT NULL,
    fat REAL NOT NULL,
    fibre REAL,
    alcohol REAL
  );
`;

type Row = {
  id: number;
  name: string;
  protein: number;
  carbohydrate: number;
  fat: number;
  fibre: number | null;
  alcohol: number | null;
};

export class SqliteFoodStore implements FoodStore {
  constructor(private readonly db: SqlDatabase) {}

  async add(food: NewFood): Promise<void> {
    const { name, macros } = newFood(food);
    const db = await this.opened();
    await db.runAsync(
      'INSERT INTO foods (name, protein, carbohydrate, fat, fibre, alcohol) VALUES (?, ?, ?, ?, ?, ?)',
      [
        name,
        macros.protein,
        macros.carbohydrate,
        macros.fat,
        macros.fibre ?? null,
        macros.alcohol ?? null,
      ],
    );
  }

  async list(): Promise<Food[]> {
    const db = await this.opened();
    const rows = await db.getAllAsync<Row>('SELECT * FROM foods ORDER BY id', []);
    return inNameOrder(
      rows.map(({ id, name, protein, carbohydrate, fat, fibre, alcohol }) => ({
        id,
        name,
        macros: {
          protein,
          carbohydrate,
          fat,
          fibre: fibre ?? undefined,
          alcohol: alcohol ?? undefined,
        },
      })),
    );
  }

  /** Made on every call rather than once, so a call after one that failed can succeed. */
  private async opened(): Promise<SqlDatabase> {
    await this.db.execAsync(SCHEMA);
    return this.db;
  }
}
