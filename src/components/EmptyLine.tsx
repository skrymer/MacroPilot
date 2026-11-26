import { Pressable, View } from 'react-native';

import { Text } from './Text';
import { useRipple } from './useRipple';

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
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        android_ripple={useRipple('page')}
        className="min-h-target min-w-target items-center justify-center ios:active:opacity-60"
      >
        <Text className="font-language-bold text-body text-ink">{action}</Text>
      </Pressable>
    </View>
  );
}
