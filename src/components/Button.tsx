import { Pressable } from 'react-native';

import { Text } from './Text';

/** An action, named for what it does (DESIGN.md, *Controls*). */
export function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-target min-w-target items-center justify-center rounded-full bg-ink px-5"
    >
      <Text className="text-center font-language-bold text-body text-ground">{label}</Text>
    </Pressable>
  );
}
