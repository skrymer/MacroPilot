import { useCallback, useEffect, useEffectEvent } from 'react';

import { useReading } from './useReading';
import { useWeighInStore, useWeighInsWritten } from './WeighInStoreContext';

/**
 * The user's weigh-ins, oldest first, read each time the screen is come to, again when asked, and
 * again when a write lands, which can be after the screen was come back to.
 */
export function useWeighIns() {
  const store = useWeighInStore();
  const written = useWeighInsWritten();
  const list = useCallback(() => store.list(), [store]);
  const { found: weighIns, readAgain } = useReading(list);
  const readItAgain = useEffectEvent(() => void readAgain());
  useEffect(() => {
    if (written > 0) readItAgain();
  }, [written]);
  return { weighIns, readAgain };
}
