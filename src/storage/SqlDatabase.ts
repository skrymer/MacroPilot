/** A value SQLite keeps in a column. `null` is SQL's NULL. */
export type SqlValue = string | number | null;

/**
 * The slice of expo-sqlite's async `SQLiteDatabase` a table store calls, so that its test runs the
 * same SQL on better-sqlite3 (ADR 0008). It grows only when a store calls something more.
 */
export interface SqlDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: SqlValue[]): Promise<unknown>;
  getAllAsync<Row>(source: string, params: SqlValue[]): Promise<Row[]>;
}
