import { BetterSqliteDatabase } from './BetterSqliteDatabase';
import { SqliteWeighInStore } from './SqliteWeighInStore';

describe('SqliteWeighInStore', () => {
  it('keeps one weigh-in a day, the last saved, and gives them back in order of day', async () => {
    // Given a weigh-in on two days, the later saved first and then saved again
    const db = new BetterSqliteDatabase();
    const store = new SqliteWeighInStore(db);
    await store.save({ day: '2026-11-28', kg: 82.4 });
    await store.save({ day: '2026-11-27', kg: 83 });
    await store.save({ day: '2026-11-28', kg: 82.1 });

    // When they are listed from a store opened again
    const listed = await new SqliteWeighInStore(db).list();

    // Then each day has its last, unrounded, oldest first
    expect(listed).toEqual([
      { day: '2026-11-27', kg: 83 },
      { day: '2026-11-28', kg: 82.1 },
    ]);
  });
});
