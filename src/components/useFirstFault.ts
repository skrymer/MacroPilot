import { useRef, type ComponentRef } from 'react';
import type { LayoutChangeEvent, ScrollView } from 'react-native';

/**
 * Brings a refused form's first fault into view, with its label: the system keeps the focused field in
 * view, and not what is above it. `names` are the fields from the top, each in a view that takes its
 * `onLayoutOf`, and `scroll` is the page's.
 */
export function useFirstFault(names: readonly string[]) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const tops = useRef<Record<string, number>>({});
  const onLayoutOf =
    (name: string) =>
    ({ nativeEvent }: LayoutChangeEvent) => {
      tops.current[name] = nativeEvent.layout.y;
    };
  const show = (faults: object) => {
    const first = names.find((name) => name in faults);
    // At once: one still moving is cut off by the system's own, to the field alone.
    if (first) scroll.current?.scrollTo({ y: tops.current[first], animated: false });
  };
  return { scroll, onLayoutOf, show };
}
