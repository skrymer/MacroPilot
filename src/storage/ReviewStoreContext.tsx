import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { ReviewStore } from './ReviewStore';

/** The store, and how many of its writes have landed: a reader reads again on each. */
const ReviewStoreContext = createContext<{ store: ReviewStore; written: number } | null>(null);

/**
 * Hands screens their `ReviewStore`, so a test can hand them one in memory. A review saved after the
 * user has left the form that ran it still reaches the screen they went to, which read before it landed.
 */
export function ReviewStoreProvider({
  store,
  children,
}: {
  store: ReviewStore;
  children: ReactNode;
}) {
  const [written, setWritten] = useState(0);
  const counted = useMemo<ReviewStore>(
    () => ({
      save: async (review) => {
        await store.save(review);
        setWritten((count) => count + 1);
      },
      list: () => store.list(),
    }),
    [store],
  );
  return (
    <ReviewStoreContext.Provider value={{ store: counted, written }}>
      {children}
    </ReviewStoreContext.Provider>
  );
}

export function useReviewStore(): ReviewStore {
  return useReviewContext().store;
}

/** How many writes have landed: a reading keyed on it reads again after each. */
export function useReviewsWritten(): number {
  return useReviewContext().written;
}

function useReviewContext() {
  const context = useContext(ReviewStoreContext);
  if (context === null) throw new Error('useReviewStore needs a ReviewStoreProvider');
  return context;
}
