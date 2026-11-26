import { Pressable } from 'react-native';

import { Text } from './Text';
import { useRipple } from './useRipple';

/** The way out of a full-height page, at its top. */
export function CancelButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={useRipple('page')}
      className="min-h-target min-w-target items-center justify-center self-start ios:active:opacity-60"
    >
      <Text className="font-language text-body text-ink">Cancel</Text>
    </Pressable>
  );
}
