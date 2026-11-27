import { useCallback } from 'react';

import { useReading } from './useReading';
import { useWeighInStore } from './WeighInStoreContext';

/** The user's weigh-ins, oldest first, read each time the screen is come to, and again when asked. */
export function useWeighIns() {
  const store = useWeighInStore();
  const list = useCallback(() => store.list(), [store]);
  const { found: weighIns, ...reading } = useReading(list);
  return { weighIns, ...reading };
}
