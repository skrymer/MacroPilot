import { View } from 'react-native';

/** Between one row of a card and the next, inside the card's margin. */
export const Hairline = () => (
  <View className="bg-surface px-grid-2">
    <View className="border-t border-line" />
  </View>
);
