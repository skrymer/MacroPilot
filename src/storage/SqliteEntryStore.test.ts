import { estimatedEntry, weighedEntry } from '@/domain/entry';

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

  it('gives back estimates as they were logged among weighed entries, protein not stated or none', async () => {
    // Given a weighed entry between an estimate that states no protein and one that states 0
    const { db, food } = await withFood(OATS);
    const store = new SqliteEntryStore(db);
    const lunch = estimatedEntry({ label: ' pub LUNCH ', calories: 850.5 }, '2026-11-24');
    const oats = weighedEntry(food, 80, '2026-11-24');
    const broth = estimatedEntry({ label: 'broth', calories: 0, protein: 0 }, '2026-11-24');
    for (const entry of [lunch, oats, broth]) await store.add(entry);

    // When their day is listed
    const entries = await new SqliteEntryStore(db).listOn('2026-11-24');

    // Then each is there in order, an estimate under its own label, and with no food's figures
    expect(entries).toStrictEqual([
      { ...lunch, id: 1, name: ' pub LUNCH ' },
      { ...oats, id: 2, name: 'rolled OATS' },
      { ...broth, id: 3, name: 'broth' },
    ]);
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
      entries.map((entry) => [
        entry.id,
        'grams' in entry && entry.grams,
        entry.calories,
        entry.protein,
      ]),
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

  it.each([
    ['both a food and a label', "1, 80, 'lunch', 100, 10"],
    ['neither', 'NULL, NULL, NULL, 100, 10'],
    ['a food and no grams', '1, NULL, NULL, 100, 10'],
    ['a label and grams', "NULL, 80, 'lunch', 100, 10"],
    ['a food and no protein', '1, 80, NULL, 100, NULL'],
  ])('keeps no entry of %s, whoever writes it', async (_, values) => {
    // Given a database with a food in it
    const { db } = await withFood(OATS);
    const store = new SqliteEntryStore(db);
    await store.listOn('2026-11-24');

    // When such an entry is written past the store
    const writing = db.runAsync(
      `INSERT INTO entries (day, food_id, grams, label, calories, protein) VALUES ('2026-11-24', ${values})`,
      [],
    );

    // Then the table refuses it
    await expect(writing).rejects.toThrow('CHECK');
    expect(await store.listOn('2026-11-24')).toEqual([]);
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
