import { SymbolView } from 'expo-symbols';
import { Pressable, type ColorValue } from 'react-native';

import { useRipple } from './useRipple';

/**
 * The way out of a form on Android, Material's close X in its top app bar, heard as *Cancel*. iOS
 * draws its own. Its ink is the bar's, which the bar hands to what it draws.
 */
export function CancelButton({ onPress, tint }: { onPress: () => void; tint?: ColorValue }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cancel"
      onPress={onPress}
      android_ripple={useRipple('page')}
      className="min-h-target min-w-target items-center justify-center"
    >
      <SymbolView name={{ ios: 'xmark', android: 'close' }} size={24} tintColor={tint} />
    </Pressable>
  );
}
