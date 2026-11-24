import type { SqlDatabase, SqlValue } from './SqlDatabase';

/** A database opened by the first call on it, so that one that cannot be opened is a call that fails. */
export class LazyDatabase implements SqlDatabase {
  private opening?: Promise<SqlDatabase>;

  constructor(private readonly open: () => Promise<SqlDatabase>) {}

  async execAsync(source: string): Promise<void> {
    await (await this.opened()).execAsync(source);
  }

  async runAsync(source: string, params: SqlValue[]): Promise<void> {
    await (await this.opened()).runAsync(source, params);
  }

  async getAllAsync<Row>(source: string, params: SqlValue[]): Promise<Row[]> {
    return (await this.opened()).getAllAsync<Row>(source, params);
  }

  private opened(): Promise<SqlDatabase> {
    this.opening ??= this.open().catch((fault) => {
      this.opening = undefined;
      throw fault;
    });
    return this.opening;
  }
}
