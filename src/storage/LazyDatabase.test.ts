import { BetterSqliteDatabase } from './BetterSqliteDatabase';
import { LazyDatabase } from './LazyDatabase';

describe('LazyDatabase', () => {
  it('opens its database once, however many calls are made on it', async () => {
    // Given a database nobody has called
    let opened = 0;
    const db = new LazyDatabase(async () => {
      opened += 1;
      return new BetterSqliteDatabase();
    });

    // When it is called, twice at once and then again
    await Promise.all([
      db.execAsync('CREATE TABLE IF NOT EXISTS t (n INTEGER)'),
      db.execAsync('CREATE TABLE IF NOT EXISTS t (n INTEGER)'),
    ]);
    await db.runAsync('INSERT INTO t VALUES (?)', [7]);

    // Then each call was on the one database
    expect(await db.getAllAsync('SELECT n FROM t', [])).toEqual([{ n: 7 }]);
    expect(opened).toBe(1);
  });

  it('opens on a later call, after one that could not open it', async () => {
    // Given a database that could not be opened the first time
    const faults = [new Error('disk I/O error')];
    const db = new LazyDatabase(async () => {
      const fault = faults.pop();
      if (fault) throw fault;
      return new BetterSqliteDatabase();
    });
    await expect(db.getAllAsync('SELECT 1 AS n', [])).rejects.toThrow('disk I/O error');

    // When it is called again
    const rows = await db.getAllAsync('SELECT 1 AS n', []);

    // Then it is open
    expect(rows).toEqual([{ n: 1 }]);
  });
});
