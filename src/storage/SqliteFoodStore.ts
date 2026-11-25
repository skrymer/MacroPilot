import { inNameOrder, newFood, type Food, type NewFood } from '@/domain/food';

import type { FoodStore } from './FoodStore';
import { withSchema } from './schema';
import type { SqlDatabase } from './SqlDatabase';

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
    const db = await withSchema(this.db);
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

  async delete(id: number): Promise<void> {
    const db = await withSchema(this.db);
    await db.runAsync('DELETE FROM foods WHERE id = ?', [id]);
  }

  async list(): Promise<Food[]> {
    const db = await withSchema(this.db);
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
}
