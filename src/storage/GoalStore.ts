import type { Goal } from '@/domain/goal';

/** The user's one Goal. A call that fails rejects, and has changed nothing. */
export interface GoalStore {
  /** Undefined until one is set. */
  read(): Promise<Goal | undefined>;
  /** Replaces the one set before: there is never more than one. */
  save(goal: Goal): Promise<void>;
}
