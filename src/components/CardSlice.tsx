import type { ReactNode } from 'react';
import { View } from 'react-native';

/**
 * One row's part of the card a list stands in, rounded where the card begins or ends. A list's rows are
 * a `FlatList`'s items, and iOS needs the list as the page's root, so each row draws its own part.
 */
export function CardSlice({
  first,
  last,
  children,
}: {
  first: boolean;
  last: boolean;
  children: ReactNode;
}) {
  return (
    <View
      className={`overflow-hidden bg-surface ${first ? 'rounded-t-card' : ''} ${last ? 'rounded-b-card' : ''}`}
    >
      {children}
    </View>
  );
}
