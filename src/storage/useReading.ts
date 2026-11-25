import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

/** Unread claims nothing: there may be some, or none. */
export type Reading<Row> = 'unread' | 'unreadable' | Row[];

/**
 * What `list` gives, read each time the screen is come to, when `list` changes, and again when asked.
 * What was found is there until it is replaced.
 * An older reading that comes in late never stands in for a newer one.
 */
export function useReading<Row>(list: () => Promise<Row[]>) {
  const [found, setFound] = useState<Reading<Row>>('unread');
  const newest = useRef(0);
  const read = useCallback(() => {
    const reading = ++newest.current;
    const show = (rows: Reading<Row>) => {
      if (reading === newest.current) setFound(rows);
    };
    return list().then(show, () => show('unreadable'));
  }, [list]);
  useFocusEffect(useCallback(() => void read(), [read]));
  const readAgain = () => {
    setFound((was) => (Array.isArray(was) ? was : 'unread'));
    return read();
  };
  return { found, readAgain };
}
