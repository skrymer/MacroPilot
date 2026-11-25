import { inNameOrder, newFood, type Food, type NewFood } from '@/domain/food';

import type { FoodStore } from './FoodStore';
import { held } from './held';
import type { InMemoryEntryStore } from './InMemoryEntryStore';

/** For tests: a `FoodStore` that forgets, and can be made to fail or wait as a phone's storage would. */
export class InMemoryFoodStore implements FoodStore {
  unreadable = false;
  unwritable = false;
  private writable: Promise<void> = Promise.resolve();
  private readable: Promise<void> = Promise.resolve();
  private foods: Food[] = [];
  private entries?: InMemoryEntryStore;
  private lastId = 0;

  /** Every write waits from here until what this gives back is called. */
  holdWrites(): () => void {
    const { until, release } = held();
    this.writable = until;
    return release;
  }

  /** The next read waits until what this gives back is called, and then says what it would have. */
  holdNextRead(): () => void {
    const { until, release } = held();
    this.readable = until;
    return release;
  }

  async add(food: NewFood): Promise<void> {
    await this.writable;
    if (this.unwritable) throw new Error('The foods cannot be written');
    this.foods.push({ id: ++this.lastId, ...newFood(food) });
  }

  /** Its foods are logged in `entries`, and one that is stays. */
  loggedIn(entries: InMemoryEntryStore): void {
    this.entries = entries;
  }

  async delete(id: number): Promise<'deleted' | 'logged'> {
    await this.writable;
    if (this.unwritable) throw new Error('The foods cannot be written');
    if (this.entries?.hasEntryOf(id)) return 'logged';
    this.foods = this.foods.filter((food) => food.id !== id);
    return 'deleted';
  }

  async list(): Promise<Food[]> {
    const { unreadable, readable } = this;
    const read = inNameOrder(this.foods);
    this.readable = Promise.resolve();
    await readable;
    if (unreadable) throw new Error('The foods cannot be read');
    return read;
  }
}
