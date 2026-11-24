import { weighedEntry } from '@/domain/entry';

import { BetterSqliteDatabase } from './BetterSqliteDatabase';
import { SqliteEntryStore } from './SqliteEntryStore';
import { SqliteFoodStore } from './SqliteFoodStore';

const OATS = { name: 'rolled OATS', macros: { protein: 13.2, carbohydrate: 56.1, fat: 6.5 } };

/** A database with a food in it, as it is kept. */
const withFood = async (food: typeof OATS) => {
  const db = new BetterSqliteDatabase();
  const foods = new SqliteFoodStore(db);
  await foods.add(food);
  const [kept] = await foods.list();
  if (kept === undefined) throw new Error('The food was not kept');
  return { db, food: kept };
};

describe('SqliteEntryStore', () => {
  it('gives back a weighed entry as it was logged, under its food’s name', async () => {
    // Given an entry added to a store, and a store opened again on the same database
    const { db, food } = await withFood(OATS);
    const entry = weighedEntry(food, 80, '2026-11-24');
    await new SqliteEntryStore(db).add(entry);
    const reopened = new SqliteEntryStore(db);

    // When its day is listed
    const entries = await reopened.listOn('2026-11-24');

    // Then it is there, each figure in its own place
    expect(entries).toEqual([{ ...entry, id: 1, name: 'rolled OATS' }]);
  });

  it('lists one day alone, oldest first, with a zero still zero', async () => {
    // Given a food of no calories logged on three days, twice on one
    const nothing = { protein: 0, carbohydrate: 0, fat: 0 };
    const { db, food } = await withFood({ name: 'coffee', macros: nothing });
    const store = new SqliteEntryStore(db);
    for (const [grams, day] of [
      [250, '2026-11-24'],
      [100, '2026-11-25'],
      [90, '2026-11-24'],
      [50, '2026-11-23'],
    ] as const) {
      await store.add(weighedEntry(food, grams, day));
    }

    // When one of them is listed
    const entries = await store.listOn('2026-11-24');

    // Then it has its own two, in the order they were logged
    expect(
      entries.map(({ id, grams, calories, protein }) => [id, grams, calories, protein]),
    ).toEqual([
      [1, 250, 0, 0],
      [3, 90, 0, 0],
    ]);
  });

  it('keeps an entry’s figures and takes its name, when its food changes after', async () => {
    // Given an entry logged of a food that was renamed and whose macros were changed after
    const { db, food } = await withFood(OATS);
    const store = new SqliteEntryStore(db);
    const entry = weighedEntry(food, 80, '2026-11-24');
    await store.add(entry);
    await db.runAsync('UPDATE foods SET name = ?, protein = ?', ['porridge', 99]);

    // When its day is listed
    const [listed] = await store.listOn('2026-11-24');

    // Then it has the food's name now, and the figures it was logged with
    expect(listed).toEqual({ ...entry, id: 1, name: 'porridge' });
  });

  it('finds nothing on a phone that has kept nothing', async () => {
    // Given a database nothing was ever kept in
    const store = new SqliteEntryStore(new BetterSqliteDatabase());

    // When a day is listed
    const entries = await store.listOn('2026-11-24');

    // Then there is nothing on it, rather than a fault
    expect(entries).toEqual([]);
  });
});
