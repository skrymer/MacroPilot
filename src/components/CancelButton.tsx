import { Pressable } from 'react-native';

import { Text } from './Text';

/** The way out of a full-height page, at its top. */
export function CancelButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-target min-w-target items-center justify-center self-start"
    >
      <Text className="font-language text-body text-ink">Cancel</Text>
    </Pressable>
  );
}
