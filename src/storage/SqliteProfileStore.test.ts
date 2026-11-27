import { BetterSqliteDatabase } from './BetterSqliteDatabase';
import { SqliteProfileStore } from './SqliteProfileStore';

const PROFILE = {
  sex: 'female',
  born: '1984-03-14',
  heightCm: 168.5,
  countsCalories: false,
} as const;

describe('SqliteProfileStore', () => {
  it('gives back a profile as it was saved, to a store opened again', async () => {
    // Given a profile saved, and a store opened again on the same database
    const db = new BetterSqliteDatabase();
    await new SqliteProfileStore(db).save(PROFILE);
    const reopened = new SqliteProfileStore(db);

    // When the profile is read
    const read = await reopened.read();

    // Then it is the one saved
    expect(read).toEqual(PROFILE);
  });

  it('keeps only the last profile saved, calorie tracking and all', async () => {
    // Given a profile saved, and then another
    const store = new SqliteProfileStore(new BetterSqliteDatabase());
    await store.save(PROFILE);
    await store.save({ sex: 'male', born: '1990-01-02', heightCm: 181, countsCalories: true });

    // When the profile is read
    const read = await store.read();

    // Then it is the second
    expect(read).toEqual({ sex: 'male', born: '1990-01-02', heightCm: 181, countsCalories: true });
  });

  it('has none before one is saved', async () => {
    // Given a database nothing was saved in
    const store = new SqliteProfileStore(new BetterSqliteDatabase());

    // When the profile is read
    const read = await store.read();

    // Then there is none, and not an empty one
    expect(read).toBeUndefined();
  });
});
