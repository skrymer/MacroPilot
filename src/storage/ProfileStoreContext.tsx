import { createContext, useContext, type ReactNode } from 'react';

import type { ProfileStore } from './ProfileStore';

const ProfileStoreContext = createContext<ProfileStore | null>(null);

/** Hands screens their `ProfileStore`, so a test can hand them one in memory. */
export function ProfileStoreProvider({
  store,
  children,
}: {
  store: ProfileStore;
  children: ReactNode;
}) {
  return <ProfileStoreContext.Provider value={store}>{children}</ProfileStoreContext.Provider>;
}

export function useProfileStore(): ProfileStore {
  const store = useContext(ProfileStoreContext);
  if (store === null) throw new Error('useProfileStore needs a ProfileStoreProvider');
  return store;
}
