import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';
import { useTint } from './useTint';

/**
 * What a page with nothing else on it says, and the way on from there: the quiet empty state, centred,
 * with a sign in `ink-mid` and an outlined button (DESIGN.md, *Lists and rows*).
 */
export function Notice({
  title,
  detail,
  action,
  onAction,
}: {
  title: string;
  detail?: string;
  action: string;
  onAction: () => void;
}) {
  const tint = useTint();
  return (
    <View className="items-center gap-grid-1 px-page py-grid-3">
      <SymbolView
        name={{ ios: 'fork.knife', android: 'restaurant' }}
        size={32}
        tintColor={tint['ink-mid']}
      />
      <Text className="text-center font-language-bold text-body text-ink">{title}</Text>
      {detail ? (
        <Text className="text-center font-language text-label text-ink-mid">{detail}</Text>
      ) : null}
      <View className="mt-grid-1 self-stretch">
        <Button label={action} onPress={onAction} secondary />
      </View>
    </View>
  );
}
