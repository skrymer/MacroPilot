import { useCallback } from 'react';

import { useGoalStore } from './GoalStoreContext';
import { useReading } from './useReading';

/**
 * The user's Goal, read each time the screen is come to and again when asked: a list of the one set,
 * empty before there is one.
 */
export function useGoal() {
  const store = useGoalStore();
  const list = useCallback(
    () => store.read().then((set) => (set === undefined ? [] : [set])),
    [store],
  );
  const { found: goal, ...reading } = useReading(list);
  return { goal, ...reading };
}
