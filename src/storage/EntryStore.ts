import type { WeighedEntry } from '@/domain/entry';

/** An entry as it is kept, under its food's name now. */
export type LoggedEntry = WeighedEntry & { id: number; name: string };

/** What the user has eaten. A call that fails rejects, and has changed nothing. */
export interface EntryStore {
  add(entry: WeighedEntry): Promise<void>;
  /** Oldest first. */
  listOn(day: string): Promise<LoggedEntry[]>;
}
