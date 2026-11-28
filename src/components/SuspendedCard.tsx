import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';
import { useTint } from './useTint';

/**
 * Above Today's ring while the Goal's deficit is suspended (CONTEXT.md, *Suspended Deficit*): a pause
 * sign in `ink-mid`, neither a fault nor a standing (DESIGN.md, *Asking and telling*), the reference
 * app's words, and the way to ease the goal.
 */
export function SuspendedCard({ onEase }: { onEase: () => void }) {
  const tint = useTint();
  return (
    <View className="items-center gap-grid-1 rounded-card bg-surface p-grid-2">
      <SymbolView
        name={{ ios: 'pause.circle', android: 'pause_circle' }}
        size={32}
        tintColor={tint['ink-mid']}
      />
      <Text className="text-center font-language-bold text-body text-ink">
        No deficit is being applied
      </Text>
      <Text className="text-center font-language text-label text-ink-mid">
        Your goal’s rate needs more of a daily deficit than your maintenance can give, so MacroPilot
        isn’t applying one. Your calorie budget below is your full maintenance — you’re holding
        steady, not losing.
      </Text>
      <Button label="Ease your goal" onPress={onEase} secondary />
    </View>
  );
}
