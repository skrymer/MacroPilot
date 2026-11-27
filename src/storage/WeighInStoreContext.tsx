import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { WeighInStore } from './WeighInStore';

/** The store, and how many of its writes have landed: a reader reads again on each. */
const WeighInStoreContext = createContext<{ store: WeighInStore; written: number } | null>(null);

/**
 * Hands screens their `WeighInStore`, so a test can hand them one in memory. A weigh-in saved after
 * the user has left its form still reaches the screen they went to, which read before it landed.
 */
export function WeighInStoreProvider({
  store,
  children,
}: {
  store: WeighInStore;
  children: ReactNode;
}) {
  const [written, setWritten] = useState(0);
  const counted = useMemo<WeighInStore>(
    () => ({
      save: async (weighIn) => {
        await store.save(weighIn);
        setWritten((count) => count + 1);
      },
      list: () => store.list(),
    }),
    [store],
  );
  return (
    <WeighInStoreContext.Provider value={{ store: counted, written }}>
      {children}
    </WeighInStoreContext.Provider>
  );
}

export function useWeighInStore(): WeighInStore {
  return useWeighInContext().store;
}

/** How many writes have landed: a reading keyed on it reads again after each. */
export function useWeighInsWritten(): number {
  return useWeighInContext().written;
}

function useWeighInContext() {
  const context = useContext(WeighInStoreContext);
  if (context === null) throw new Error('useWeighInStore needs a WeighInStoreProvider');
  return context;
}
