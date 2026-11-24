import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import type { Food } from '@/domain/food';

import { useFoodStore } from './FoodStoreContext';

/** Unread claims nothing: there may be foods, or none. */
type ReadFoods = { foods: 'unread' | 'unreadable' | Food[]; readAgain: () => void };

/** The user's foods, read each time the screen is come to, and again when asked. */
export function useFoods(): ReadFoods {
  const store = useFoodStore();
  const [foods, setFoods] = useState<ReadFoods['foods']>('unread');
  const newest = useRef(0);
  const read = useCallback(() => {
    const reading = ++newest.current;
    const show = (found: ReadFoods['foods']) => {
      if (reading === newest.current) setFoods(found);
    };
    store.list().then(show, () => show('unreadable'));
  }, [store]);
  useFocusEffect(read);
  const readAgain = () => {
    setFoods('unread');
    read();
  };
  return { foods, readAgain };
}
