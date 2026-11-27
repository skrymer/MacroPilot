import { useCallback, useEffect, useEffectEvent } from 'react';

import { useReviewStore, useReviewsWritten } from './ReviewStoreContext';
import { useReading } from './useReading';

/**
 * The reviews, oldest first, read each time the screen is come to, and again when a write lands,
 * which can be after the screen was come back to from the form that ran it.
 */
export function useReviews() {
  const store = useReviewStore();
  const written = useReviewsWritten();
  const list = useCallback(() => store.list(), [store]);
  const { found: reviews, readAgain } = useReading(list);
  const readItAgain = useEffectEvent(() => void readAgain());
  useEffect(() => {
    if (written > 0) readItAgain();
  }, [written]);
  return { reviews };
}
