import { inNameOrder, newFood, type Food, type NewFood } from '@/domain/food';

import type { FoodStore } from './FoodStore';

/** A wait that ends when it is told to. */
const held = () => {
  let release = () => {};
  const until = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { until, release };
};

/** For tests: a `FoodStore` that forgets, and can be made to fail or wait as a phone's storage would. */
export class InMemoryFoodStore implements FoodStore {
  unreadable = false;
  unwritable = false;
  private writable: Promise<void> = Promise.resolve();
  private readable: Promise<void> = Promise.resolve();
  private readonly foods: Food[] = [];

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
    this.foods.push({ id: this.foods.length + 1, ...newFood(food) });
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
