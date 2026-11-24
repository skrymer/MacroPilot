import type { WeighedEntry } from '@/domain/entry';
import type { Food } from '@/domain/food';

import type { EntryStore, LoggedEntry } from './EntryStore';

/** For tests: an `EntryStore` that forgets, over the foods its entries are of. */
export class InMemoryEntryStore implements EntryStore {
  unreadable = false;
  unwritable = false;
  private writable: Promise<void> = Promise.resolve();
  private readonly entries: LoggedEntry[] = [];

  constructor(private readonly foods: readonly Food[] = []) {}

  /** Every write waits from here until what this gives back is called. */
  holdWrites(): () => void {
    let release = () => {};
    this.writable = new Promise((resolve) => {
      release = resolve;
    });
    return release;
  }

  async add(entry: WeighedEntry): Promise<void> {
    await this.writable;
    if (this.unwritable) throw new Error('The entry cannot be written');
    const food = this.foods.find(({ id }) => id === entry.foodId);
    if (food === undefined) throw new Error('An entry is of a food that is kept');
    this.entries.push({ ...entry, id: this.entries.length + 1, name: food.name });
  }

  async listOn(day: string): Promise<LoggedEntry[]> {
    if (this.unreadable) throw new Error('The day cannot be read');
    return this.entries.filter((entry) => entry.day === day);
  }
}
