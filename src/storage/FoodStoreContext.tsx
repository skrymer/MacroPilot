import { createContext, useContext, type ReactNode } from 'react';

import type { FoodStore } from './FoodStore';

const FoodStoreContext = createContext<FoodStore | null>(null);

/** Hands screens their `FoodStore`, so a test can hand them one in memory. */
export function FoodStoreProvider({ store, children }: { store: FoodStore; children: ReactNode }) {
  return <FoodStoreContext.Provider value={store}>{children}</FoodStoreContext.Provider>;
}

export function useFoodStore(): FoodStore {
  const store = useContext(FoodStoreContext);
  if (store === null) throw new Error('useFoodStore needs a FoodStoreProvider');
  return store;
}
