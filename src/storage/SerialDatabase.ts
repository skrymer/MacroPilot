import type { SqlDatabase, SqlStatements, SqlValue } from './SqlDatabase';

/**
 * One connection whose calls run one at a time, in the order made. SQLite holds one transaction per
 * connection, and a call made while one is open joins it, so a transaction keeps the turn from its
 * BEGIN to its COMMIT or ROLLBACK and every other call waits for it.
 */
export class SerialDatabase implements SqlDatabase {
  private line: Promise<unknown> = Promise.resolve();

  constructor(private readonly db: SqlStatements) {}

  execAsync(source: string): Promise<void> {
    return this.inTurn(() => this.db.execAsync(source));
  }

  runAsync(source: string, params: SqlValue[]): Promise<unknown> {
    return this.inTurn(() => this.db.runAsync(source, params));
  }

  getAllAsync<Row>(source: string, params: SqlValue[]): Promise<Row[]> {
    return this.inTurn(() => this.db.getAllAsync<Row>(source, params));
  }

  withTransactionAsync(task: (tx: SqlStatements) => Promise<void>): Promise<void> {
    return this.inTurn(async () => {
      await this.db.execAsync('BEGIN');
      try {
        await task(this.db);
        await this.db.execAsync('COMMIT');
      } catch (fault) {
        // The caller hears the task's fault, not the rollback's (ADR 0008, *Amended*).
        await this.db.execAsync('ROLLBACK').catch(() => {});
        throw fault;
      }
    });
  }

  /** Runs `work` once every call made before it has ended, kept or failed. */
  private inTurn<T>(work: () => Promise<T>): Promise<T> {
    const turn = this.line.then(work, work);
    this.line = turn.catch(() => {});
    return turn;
  }
}
