import { createContext, useContext, type ReactNode } from 'react';

import type { ReviewStore } from './ReviewStore';

const ReviewStoreContext = createContext<ReviewStore | null>(null);

/** Hands screens their `ReviewStore`, so a test can hand them one in memory. */
export function ReviewStoreProvider({
  store,
  children,
}: {
  store: ReviewStore;
  children: ReactNode;
}) {
  return <ReviewStoreContext.Provider value={store}>{children}</ReviewStoreContext.Provider>;
}

export function useReviewStore(): ReviewStore {
  const store = useContext(ReviewStoreContext);
  if (store === null) throw new Error('useReviewStore needs a ReviewStoreProvider');
  return store;
}
