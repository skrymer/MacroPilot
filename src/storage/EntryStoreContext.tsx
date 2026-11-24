import { createContext, useContext, type ReactNode } from 'react';

import type { EntryStore } from './EntryStore';

const EntryStoreContext = createContext<EntryStore | null>(null);

/** Hands screens their `EntryStore`, so a test can hand them one in memory. */
export function EntryStoreProvider({
  store,
  children,
}: {
  store: EntryStore;
  children: ReactNode;
}) {
  return <EntryStoreContext.Provider value={store}>{children}</EntryStoreContext.Provider>;
}

export function useEntryStore(): EntryStore {
  const store = useContext(EntryStoreContext);
  if (store === null) throw new Error('useEntryStore needs an EntryStoreProvider');
  return store;
}
