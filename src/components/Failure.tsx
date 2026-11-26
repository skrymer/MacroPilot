import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';

import { Text } from './Text';
import { useTint } from './useTint';

/**
 * What failed, said where it failed and told to a screen reader at once: in `fault` with the warning
 * sign, so the hue is never alone.
 */
export function Failure({ words }: { words: string }) {
  const tint = useTint();
  return (
    <View className="flex-row items-center gap-grid-1">
      <SymbolView
        name={{ ios: 'exclamationmark.triangle.fill', android: 'warning' }}
        size={18}
        tintColor={tint.fault}
      />
      <Text accessibilityRole="alert" className="flex-1 font-language-bold text-body text-fault">
        {words}
      </Text>
    </View>
  );
}
