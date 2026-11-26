import { SymbolView } from 'expo-symbols';
import { Pressable } from 'react-native';

import { Text } from './Text';
import { useRipple } from './useRipple';
import { useTint } from './useTint';

const CHEVRONS = {
  down: { ios: 'chevron.down', android: 'expand_more' },
  up: { ios: 'chevron.up', android: 'expand_less' },
} as const;

/**
 * A card's own last row, which asks for the rest of its list or for less of it: no outline, since the
 * card bounds it, and a chevron saying which way the card goes (DESIGN.md, *Lists and rows*).
 */
export function ShowAll({
  label,
  opens,
  onPress,
}: {
  label: string;
  opens: 'down' | 'up';
  onPress: () => void;
}) {
  const tint = useTint();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={useRipple('page')}
      className="min-h-target min-w-target flex-row items-center justify-between overflow-hidden px-grid-2 ios:active:opacity-60"
    >
      <Text className="font-language-bold text-body text-ink">{label}</Text>
      <SymbolView name={CHEVRONS[opens]} size={18} tintColor={tint['ink-mid']} />
    </Pressable>
  );
}
