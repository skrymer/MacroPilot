import { BetterSqliteDatabase } from './BetterSqliteDatabase';
import { SqliteReviewStore } from './SqliteReviewStore';

const REVIEW = {
  trendKg: 81.8,
  maintenanceKcal: 2441.95,
  budgetKcal: 2441.95,
  proteinFloorG: 163.6,
};

describe('SqliteReviewStore', () => {
  it('gives back reviews unrounded, oldest first, a review for a day replacing those on or after it', async () => {
    // Given reviews on the 20th and the 27th, and then one for the 27th again
    const db = new BetterSqliteDatabase();
    const store = new SqliteReviewStore(db);
    await store.save({ ...REVIEW, day: '2026-11-27' });
    await store.save({ ...REVIEW, day: '2026-11-20', budgetKcal: 2500.5 });
    await store.save({ ...REVIEW, day: '2026-11-27', trendKg: 82 });

    // When they are listed from a store opened again
    const listed = await new SqliteReviewStore(db).list();

    // Then the 20th's stands, and the 27th's is the last saved
    expect(listed).toEqual([
      { ...REVIEW, day: '2026-11-20', budgetKcal: 2500.5 },
      { ...REVIEW, day: '2026-11-27', trendKg: 82 },
    ]);
  });

  it('changes nothing when a save fails partway, the later review still standing alone', async () => {
    // Given a review on the 27th, and a table that refuses to have reviews deleted
    const db = new BetterSqliteDatabase();
    const store = new SqliteReviewStore(db);
    await store.save({ ...REVIEW, day: '2026-11-27' });
    await db.execAsync(
      "CREATE TRIGGER refuse BEFORE DELETE ON reviews BEGIN SELECT RAISE(ABORT, 'refused'); END;",
    );

    // When a review for the 20th is saved, which would delete the 27th's
    const saving = store.save({ ...REVIEW, day: '2026-11-20' });

    // Then the save fails, and the 20th's was not kept
    await expect(saving).rejects.toThrow('refused');
    expect((await store.list()).map(({ day }) => day)).toEqual(['2026-11-27']);
  });
});
