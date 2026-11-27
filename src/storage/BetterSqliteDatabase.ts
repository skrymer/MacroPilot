import Database from 'better-sqlite3';

import { SerialDatabase } from './SerialDatabase';
import type { SqlStatements, SqlValue } from './SqlDatabase';

/** better-sqlite3's connection behind the statements the phone's connection answers. */
export class BetterSqliteStatements implements SqlStatements {
  private readonly db = new Database(':memory:');

  constructor() {
    this.db.pragma('foreign_keys = OFF');
  }

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

/**
 * For tests: a real SQLite in memory behind the port a store takes on the phone (ADR 0008), its calls
 * run in turn as the phone's are. Each instance is fresh and empty, and holds to no keys unasked, as a
 * phone's does.
 */
export class BetterSqliteDatabase extends SerialDatabase {
  constructor() {
    super(new BetterSqliteStatements());
  }
}
