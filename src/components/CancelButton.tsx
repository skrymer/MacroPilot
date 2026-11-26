import { SymbolView } from 'expo-symbols';
import { Pressable } from 'react-native';

import { useRipple } from './useRipple';
import { useTint } from './useTint';

/** The way out of a form on Android, Material's close X in its top app bar, heard as *Cancel*. */
export function CancelButton({ onPress }: { onPress: () => void }) {
  const tint = useTint();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cancel"
      onPress={onPress}
      android_ripple={useRipple('page')}
      className="min-h-target min-w-target items-center justify-center"
    >
      {/* The header is drawn outside the page and its tokens: its ink, as a value. */}
      <SymbolView name={{ ios: 'xmark', android: 'close' }} size={24} tintColor={tint.ink} />
    </Pressable>
  );
}
