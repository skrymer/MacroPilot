import { Pressable, View } from 'react-native';

import { Text } from './Text';

/**
 * A name with its detail under it and its figure at the right, read out as one thing, and pressed where
 * it leads somewhere. The figure drops below the name when they do not both fit.
 */
export function Row({
  name,
  detail,
  figure,
  spoken,
  onPress,
}: {
  name: string;
  detail: string;
  figure: string;
  spoken: string;
  onPress?: () => void;
}) {
  const said = (
    <>
      <View className="min-w-name flex-1">
        <Text className="font-language text-body text-ink">{name}</Text>
        <Text className="font-language text-label text-ink-mid">{detail}</Text>
      </View>
      <Text className="font-weighed text-body text-ink">{figure}</Text>
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      onPress={onPress}
      className="min-h-target min-w-target flex-row flex-wrap items-center justify-between gap-x-4 py-3"
    >
      {said}
    </Pressable>
  ) : (
    <View
      accessible
      accessibilityLabel={spoken}
      className="min-h-target flex-row flex-wrap items-center justify-between gap-x-4 py-3"
    >
      {said}
    </View>
  );
}
