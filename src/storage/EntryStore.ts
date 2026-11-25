import type { Entry } from '@/domain/entry';

/** An entry as it is kept, under its food's name now or its own label. */
export type LoggedEntry = Entry & { id: number; name: string };

/** What the user has eaten. A call that fails rejects, and has changed nothing. */
export interface EntryStore {
  add(entry: Entry): Promise<void>;
  /** Oldest first. */
  listOn(day: string): Promise<LoggedEntry[]>;
}
