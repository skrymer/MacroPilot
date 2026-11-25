import { useCallback } from 'react';

import { useFoodStore } from './FoodStoreContext';
import { useReading } from './useReading';

/** The user's foods, read each time the screen is come to, and again when asked. */
export function useFoods() {
  const store = useFoodStore();
  const list = useCallback(() => store.list(), [store]);
  const { found: foods, ...reading } = useReading(list);
  return { foods, ...reading };
}
