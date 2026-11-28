import type { Goal } from '@/domain/goal';

import type { GoalStore } from './GoalStore';

/** For tests: a `GoalStore` that forgets, and can be made to fail as a phone's storage would. */
export class InMemoryGoalStore implements GoalStore {
  unreadable = false;
  unwritable = false;
  private goal?: Goal;

  async read(): Promise<Goal | undefined> {
    if (this.unreadable) throw new Error('The goal cannot be read');
    return this.goal;
  }

  async save(goal: Goal): Promise<void> {
    if (this.unwritable) throw new Error('The goal cannot be written');
    this.goal = goal;
  }
}
