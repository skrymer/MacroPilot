import { useCallback } from 'react';

import { useProfileStore } from './ProfileStoreContext';
import { useReading } from './useReading';

/**
 * The user's profile, read each time the screen is come to and again when asked: a list of the one
 * saved, empty before there is one.
 */
export function useProfile() {
  const store = useProfileStore();
  const list = useCallback(
    () => store.read().then((saved) => (saved === undefined ? [] : [saved])),
    [store],
  );
  const { found: profile, ...reading } = useReading(list);
  return { profile, ...reading };
}
