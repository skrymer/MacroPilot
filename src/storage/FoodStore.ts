import type { Food, NewFood } from '@/domain/food';

/** The foods the user keeps. A call that fails rejects, and has changed nothing. */
export interface FoodStore {
  add(food: NewFood): Promise<void>;
  /** One that is not there is gone already. */
  delete(id: number): Promise<void>;
  /** In order of name. */
  list(): Promise<Food[]>;
}
