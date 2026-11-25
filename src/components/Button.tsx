import { Pressable } from 'react-native';

import { Text } from './Text';

/** An action, named for what it does, and outlined where it is not the page's first (DESIGN.md, *Controls*). */
export function Button({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`min-h-target min-w-target items-center justify-center rounded-full border border-ink px-5 ${secondary ? '' : 'bg-ink'}`}
    >
      <Text
        className={`text-center font-language-bold text-body ${secondary ? 'text-ink' : 'text-ground'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
