import { createContext, useContext, type ReactNode } from 'react';

import type { WeighInStore } from './WeighInStore';

const WeighInStoreContext = createContext<WeighInStore | null>(null);

/** Hands screens their `WeighInStore`, so a test can hand them one in memory. */
export function WeighInStoreProvider({
  store,
  children,
}: {
  store: WeighInStore;
  children: ReactNode;
}) {
  return <WeighInStoreContext.Provider value={store}>{children}</WeighInStoreContext.Provider>;
}

export function useWeighInStore(): WeighInStore {
  const store = useContext(WeighInStoreContext);
  if (store === null) throw new Error('useWeighInStore needs a WeighInStoreProvider');
  return store;
}
