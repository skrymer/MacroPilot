import { View } from 'react-native';

import { kcal } from './figures';
import { Text } from './Text';

/**
 * Above a form's button, how far past its budget the entry being typed would put the day, in the
 * standing it would reach: a dot, and the words. It never stops the entry.
 */
export function OverLine({
  overKcal,
  standing,
  budgetKcal,
}: {
  overKcal: number;
  standing: 'slightly over' | 'over budget';
  budgetKcal: number;
}) {
  return (
    <View className="flex-row items-center gap-grid-1">
      <View
        className={`h-3 w-3 rounded-full ${standing === 'over budget' ? 'bg-over' : 'bg-slightly-over'}`}
      />
      <Text
        className={`flex-1 font-language-bold text-body ${standing === 'over budget' ? 'text-over' : 'text-slightly-over'}`}
      >
        {`This puts you about ${kcal(overKcal)} over your ${kcal(budgetKcal)} budget.`}
      </Text>
    </View>
  );
}
