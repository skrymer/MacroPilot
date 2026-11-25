import { Pressable } from 'react-native';

import { Text } from './Text';

/** *Delete* at the end of a row, heard with what it deletes. */
export function DeleteButton({ name, onPress }: { name: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Delete ${name}`}
      onPress={onPress}
      className="min-h-target min-w-target items-center justify-center"
    >
      <Text className="font-language text-body text-ink">Delete</Text>
    </Pressable>
  );
}
