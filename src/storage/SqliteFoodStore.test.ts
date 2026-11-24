import { BetterSqliteDatabase } from './BetterSqliteDatabase';
import { SqliteFoodStore } from './SqliteFoodStore';

describe('SqliteFoodStore', () => {
  it('gives back a food as it was added, its name as typed and a zero still zero', async () => {
    // Given a food added to a store, and a store opened again on the same database
    const db = new BetterSqliteDatabase();
    await new SqliteFoodStore(db).add({
      name: ' rolled OATS ',
      macros: { protein: 13.2, carbohydrate: 0, fat: 6.5 },
    });
    const reopened = new SqliteFoodStore(db);

    // When the foods are listed
    const foods = await reopened.list();

    // Then the food is there, each macro in its own place
    expect(foods).toEqual([
      { id: 1, name: ' rolled OATS ', macros: { protein: 13.2, carbohydrate: 0, fat: 6.5 } },
    ]);
  });

  it('keeps a figure not stated apart from a zero', async () => {
    // Given a food that states neither fibre nor alcohol, one that has none of either, and one with both
    const store = new SqliteFoodStore(new BetterSqliteDatabase());
    const stated = { protein: 1, carbohydrate: 2, fat: 3 };
    await store.add({ name: 'a', macros: stated });
    await store.add({ name: 'b', macros: { ...stated, fibre: 0, alcohol: 0 } });
    await store.add({ name: 'c', macros: { ...stated, fibre: 16.8, alcohol: 10.257 } });

    // When they are listed
    const foods = await store.list();

    // Then each is as it was added
    expect(foods.map(({ macros }) => macros)).toStrictEqual([
      { ...stated, fibre: undefined, alcohol: undefined },
      { ...stated, fibre: 0, alcohol: 0 },
      { ...stated, fibre: 16.8, alcohol: 10.257 },
    ]);
  });

  it('lists foods in order of name, whatever their case', async () => {
    // Given foods added in no order
    const store = new SqliteFoodStore(new BetterSqliteDatabase());
    const macros = { protein: 1, carbohydrate: 2, fat: 3 };
    for (const name of ['oats', 'Zucchini', 'Milk', 'apple']) await store.add({ name, macros });

    // When they are listed
    const foods = await store.list();

    // Then they are in order
    expect(foods.map(({ name }) => name)).toEqual(['apple', 'Milk', 'oats', 'Zucchini']);
  });

  it('keeps nothing of a food the domain refuses', async () => {
    // Given an empty store
    const store = new SqliteFoodStore(new BetterSqliteDatabase());

    // When a food with a negative macro is added
    const adding = store.add({ name: 'Oats', macros: { protein: -1, carbohydrate: 0, fat: 0 } });

    // Then it is refused, and the store is still empty
    await expect(adding).rejects.toThrow('protein must be 0 or more');
    expect(await store.list()).toEqual([]);
  });

  it('lists the foods once the database can be opened, after a time it could not', async () => {
    // Given a database that failed to open the first time it was read
    const db = new BetterSqliteDatabase();
    jest.spyOn(db, 'execAsync').mockRejectedValueOnce(new Error('disk I/O error'));
    const store = new SqliteFoodStore(db);
    await expect(store.list()).rejects.toThrow('disk I/O error');

    // When the foods are listed again
    const foods = await store.list();

    // Then they are read
    expect(foods).toEqual([]);
  });

  it('never uses an id again after the food that had it is gone', async () => {
    // Given the newest of two foods deleted
    const db = new BetterSqliteDatabase();
    const store = new SqliteFoodStore(db);
    const macros = { protein: 1, carbohydrate: 2, fat: 3 };
    await store.add({ name: 'Apple', macros });
    await store.add({ name: 'Banana', macros });
    await db.runAsync('DELETE FROM foods WHERE name = ?', ['Banana']);

    // When another is added
    await store.add({ name: 'Cherry', macros });

    // Then it has an id of its own
    expect((await store.list()).map(({ id }) => id)).toEqual([1, 3]);
  });
});
