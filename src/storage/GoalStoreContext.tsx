import { createContext, useContext, type ReactNode } from 'react';

import type { GoalStore } from './GoalStore';

const GoalStoreContext = createContext<GoalStore | null>(null);

/** Hands screens their `GoalStore`, so a test can hand them one in memory. */
export function GoalStoreProvider({ store, children }: { store: GoalStore; children: ReactNode }) {
  return <GoalStoreContext.Provider value={store}>{children}</GoalStoreContext.Provider>;
}

export function useGoalStore(): GoalStore {
  const store = useContext(GoalStoreContext);
  if (store === null) throw new Error('useGoalStore needs a GoalStoreProvider');
  return store;
}
