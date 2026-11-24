import { Pressable, View } from 'react-native';

import { caloriesPer100g, type Food } from '@/domain/food';
import { shownName } from '@/domain/shownName';

import { grams, kcal, spokenGrams, spokenKcal } from './figures';
import { Row } from './Row';
import { Text } from './Text';

/** A food and its figures per 100 g, read out as one thing. */
const figuresOf = ({ name, macros }: Food) => {
  const calories = kcal(caloriesPer100g(macros));
  const spokenCalories = spokenKcal(caloriesPer100g(macros));
  return {
    name: shownName(name),
    detail: `${grams(macros.protein)} protein per ${grams(100)}`,
    figure: calories,
    spoken: `${shownName(name)}, ${spokenCalories}, ${spokenGrams(macros.protein)} of protein per 100 grams`,
  };
};

export function FoodRow({ food }: { food: Food }) {
  return <Row {...figuresOf(food)} />;
}

/** The same row, pressed to choose its food. */
export function FoodButton({ food, onPress }: { food: Food; onPress: () => void }) {
  const { name, detail, figure, spoken } = figuresOf(food);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      onPress={onPress}
      className="min-h-target min-w-target flex-row flex-wrap items-center justify-between gap-x-4 py-3"
    >
      <View className="min-w-name flex-1">
        <Text className="font-language text-body text-ink">{name}</Text>
        <Text className="font-language text-label text-ink-mid">{detail}</Text>
      </View>
      <Text className="font-weighed text-body text-ink">{figure}</Text>
    </Pressable>
  );
}
