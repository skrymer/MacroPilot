import { Pressable } from 'react-native';

import { Text } from './Text';
import { useRipple } from './useRipple';

/** A way on at a row's end, in bold words and no outline: the row is the card's, not a button's. */
export function TextAction({
  label,
  spoken,
  onPress,
}: {
  label: string;
  /** What a screen reader says, where the label alone does not say what it acts on. */
  spoken?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      onPress={onPress}
      android_ripple={useRipple('page')}
      className="min-h-target min-w-target items-center justify-center ios:active:opacity-60"
    >
      <Text className="font-language-bold text-body text-ink">{label}</Text>
    </Pressable>
  );
}
