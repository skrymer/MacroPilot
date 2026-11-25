import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Unread claims nothing: there may be some, or none. */
export type Reading<Row> = 'unread' | 'unreadable' | Row[];

/**
 * What `list` gives, read each time the screen is come to, when `list` changes, and again when asked.
 * What was found is there until it is replaced, or until `list` is another and it says nothing of it.
 * An older reading that comes in late never stands in for a newer one.
 */
export function useReading<Row>(list: () => Promise<Row[]>) {
  const [last, setLast] = useState<{ of: () => Promise<Row[]>; found: Reading<Row> }>();
  const newest = useRef(0);
  const read = useCallback(() => {
    const reading = ++newest.current;
    const show = (found: Reading<Row>) => {
      if (reading === newest.current) setLast({ of: list, found });
    };
    return list().then(show, () => show('unreadable'));
  }, [list]);
  useFocusEffect(useCallback(() => void read(), [read]));
  // Whoever asks may have kept this from before `list` was another.
  const latest = useRef(read);
  useEffect(() => {
    latest.current = read;
  }, [read]);
  const readAgain = () => {
    setLast((was) => (Array.isArray(was?.found) ? was : undefined));
    return latest.current();
  };
  const found: Reading<Row> = last?.of === list ? last.found : 'unread';
  return { found, readAgain };
}
