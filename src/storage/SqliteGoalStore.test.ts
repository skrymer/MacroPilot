import { BetterSqliteDatabase } from './BetterSqliteDatabase';
import { SqliteGoalStore } from './SqliteGoalStore';

const GOAL = { setOn: '2026-11-28', startKg: 82.35, targetKg: 75.5, rateKgPerWeek: 0.55 };

describe('SqliteGoalStore', () => {
  it('gives back a Goal as it was set, unrounded, to a store opened again', async () => {
    // Given a Goal set, and a store opened again on the same database
    const db = new BetterSqliteDatabase();
    await new SqliteGoalStore(db).save(GOAL);
    const reopened = new SqliteGoalStore(db);

    // When the Goal is read
    const read = await reopened.read();

    // Then it is the one set
    expect(read).toEqual(GOAL);
  });

  it('keeps only the last Goal set, never two', async () => {
    // Given a Goal set, and then another
    const store = new SqliteGoalStore(new BetterSqliteDatabase());
    await store.save(GOAL);
    await store.save({ setOn: '2026-11-29', startKg: 81, targetKg: 72, rateKgPerWeek: 1 });

    // When the Goal is read
    const read = await store.read();

    // Then it is the second
    expect(read).toEqual({ setOn: '2026-11-29', startKg: 81, targetKg: 72, rateKgPerWeek: 1 });
  });

  it('has none before one is set', async () => {
    // Given a database no Goal was set in
    const store = new SqliteGoalStore(new BetterSqliteDatabase());

    // When the Goal is read
    const read = await store.read();

    // Then there is none
    expect(read).toBeUndefined();
  });
});
