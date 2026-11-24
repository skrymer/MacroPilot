import Database from 'better-sqlite3';

import type { SqlDatabase, SqlValue } from './SqlDatabase';

/** For tests: a real SQLite in memory behind the port a store takes on the phone (ADR 0008). Each instance is fresh and empty. */
export class BetterSqliteDatabase implements SqlDatabase {
  private readonly db = new Database(':memory:');

  async execAsync(source: string): Promise<void> {
    this.db.exec(source);
  }

  async runAsync(source: string, params: SqlValue[]): Promise<void> {
    this.db.prepare(source).run(...params);
  }

  async getAllAsync<Row>(source: string, params: SqlValue[]): Promise<Row[]> {
    return this.db.prepare(source).all(...params) as Row[];
  }
}
