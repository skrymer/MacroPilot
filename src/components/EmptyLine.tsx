import { View } from 'react-native';

import { Text } from './Text';
import { TextAction } from './TextAction';

/**
 * An empty list under a summary that already says so: one line, with its way on at the right.
 */
export function EmptyLine({
  words,
  action,
  onAction,
}: {
  words: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-x-grid-2 rounded-card bg-surface px-grid-2">
      <Text className="font-language text-body text-ink-mid">{words}</Text>
      <TextAction label={action} onPress={onAction} />
    </View>
  );
}
