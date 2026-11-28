/** A value SQLite keeps in a column. `null` is SQL's NULL. */
export type SqlValue = string | number | null;

/**
 * The slice of expo-sqlite's async `SQLiteDatabase` a table store calls, so that its test runs the
 * same SQL on better-sqlite3 (ADR 0008). It grows only when a store calls something more.
 */
export interface SqlStatements {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: SqlValue[]): Promise<unknown>;
  getAllAsync<Row>(source: string, params: SqlValue[]): Promise<Row[]>;
}

/** The one connection the stores share, whose calls run one at a time. */
export interface SqlDatabase extends SqlStatements {
  /**
   * Runs `task`'s statements as one: all kept, or, when it rejects, none, with its error. No other
   * call runs until it ends. `task` calls `tx`, never this database, which would wait on itself.
   */
  withTransactionAsync(task: (tx: SqlStatements) => Promise<void>): Promise<void>;
}
