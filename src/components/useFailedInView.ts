import { useEffect, useEffectEvent, useRef, type ComponentRef } from 'react';
import type { FlatList, View } from 'react-native';

/**
 * Brings the row whose delete failed to the top of its list where it is part way off it, with why it is
 * still there over it. `list` is what the list takes, and `row` the failed row's `ref`.
 */
export function useFailedInView<Item extends { id: number }>(
  listed: readonly Item[],
  failed?: { id: number },
) {
  const ref = useRef<ComponentRef<typeof FlatList<Item>>>(null);
  const row = useRef<ComponentRef<typeof View>>(null);
  const show = useEffectEvent((id: number) => {
    const index = listed.findIndex((item) => item.id === id);
    if (index >= 0) ref.current?.scrollToIndex({ index, animated: false });
  });
  useEffect(() => {
    if (!failed) return;
    row.current?.measureInWindow((_x, y, _width, height) =>
      ref.current?.getNativeScrollRef()?.measureInWindow((_, top, __, room) => {
        // Not before the list has grown with the row, or the last row is scrolled to its old end.
        if (y < top || y + height > top + room) requestAnimationFrame(() => show(failed.id));
      }),
    );
  }, [failed]);
  // A row not measured yet has not been pressed on a phone.
  return { row, list: { ref, onScrollToIndexFailed: () => {} } };
}
