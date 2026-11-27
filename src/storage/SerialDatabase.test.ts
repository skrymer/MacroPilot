import Database from 'better-sqlite3';

import { SerialDatabase } from './SerialDatabase';
import type { SqlStatements, SqlValue } from './SqlDatabase';

/** better-sqlite3 in memory, with a table `t`, behind the statements a connection answers. */
const connection = (): SqlStatements => {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE t (n INTEGER)');
  return {
    execAsync: async (source: string) => void db.exec(source),
    runAsync: async (source: string, params: SqlValue[]) => db.prepare(source).run(...params),
    getAllAsync: async <Row>(source: string, params: SqlValue[]) =>
      db.prepare(source).all(...params) as Row[],
  };
};

const ns = async (db: SerialDatabase) =>
  (await db.getAllAsync<{ n: number }>('SELECT n FROM t ORDER BY n', [])).map(({ n }) => n);

describe('SerialDatabase', () => {
  it('keeps every statement of a transaction, and the next one begins', async () => {
    // Given a database
    const db = new SerialDatabase(connection());

    // When two transactions each insert, one after the other
    await db.withTransactionAsync(async (tx) => {
      await tx.runAsync('INSERT INTO t VALUES (?)', [1]);
      await tx.runAsync('INSERT INTO t VALUES (?)', [2]);
    });
    const second = db.withTransactionAsync(async (tx) => {
      await tx.runAsync('INSERT INTO t VALUES (?)', [3]);
    });

    // Then both are kept
    await expect(second).resolves.toBeUndefined();
    expect(await ns(db)).toEqual([1, 2, 3]);
  });

  it('keeps none of a transaction whose task fails, with the task’s fault', async () => {
    // Given a database
    const db = new SerialDatabase(connection());

    // When a transaction inserts and then fails
    const failing = db.withTransactionAsync(async (tx) => {
      await tx.runAsync('INSERT INTO t VALUES (?)', [1]);
      throw new Error('task failed');
    });

    // Then it rejects with that fault, and nothing was kept
    await expect(failing).rejects.toThrow('task failed');
    expect(await ns(db)).toEqual([]);
  });

  it('gives the task’s fault, not the rollback’s, when SQLite has already rolled back', async () => {
    // Given a database
    const db = new SerialDatabase(connection());

    // When a transaction's task ends the transaction itself and then fails
    const failing = db.withTransactionAsync(async (tx) => {
      await tx.execAsync('ROLLBACK');
      throw new Error('task failed');
    });

    // Then the caller hears the task's fault
    await expect(failing).rejects.toThrow('task failed');
  });

  it('keeps a call made during a transaction out of it, though the transaction fails', async () => {
    // Given a transaction under way, waiting on its second statement
    const db = new SerialDatabase(connection());
    let go = () => {};
    const waiting = new Promise<void>((resolve) => (go = resolve));
    const failing = db.withTransactionAsync(async (tx) => {
      await tx.runAsync('INSERT INTO t VALUES (?)', [1]);
      await waiting;
      throw new Error('task failed');
    });

    // When another call inserts meanwhile, and then the transaction fails
    const outside = db.runAsync('INSERT INTO t VALUES (?)', [2]);
    go();
    await expect(failing).rejects.toThrow('task failed');
    await outside;

    // Then the other call's row is kept, and the transaction's is not
    expect(await ns(db)).toEqual([2]);
  });

  it('runs the next call after one that failed', async () => {
    // Given a database, and a call that fails
    const db = new SerialDatabase(connection());
    await expect(db.runAsync('INSERT INTO nowhere VALUES (1)', [])).rejects.toThrow();

    // When the next call is made
    const next = db.runAsync('INSERT INTO t VALUES (?)', [1]);

    // Then it runs
    await expect(next).resolves.toBeDefined();
    expect(await ns(db)).toEqual([1]);
  });
});
