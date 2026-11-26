import { caloriesPer100g, type Food } from '@/domain/food';
import { shownName } from '@/domain/shownName';

import { grams, kcal, spokenGrams, spokenKcal } from './figures';
import { Row } from './Row';

const PER_100_G = `per ${grams(100)}`;

/** A food and its figures per 100 g, and the way to log it where `onLog` is given. */
export function FoodRow({
  food: { name, macros },
  onLog,
  onDelete,
}: {
  food: Food;
  onLog?: () => void;
  /** A screen reader's *Delete*, in place of the swipe it cannot make. */
  onDelete?: () => void;
}) {
  const shown = shownName(name);
  const calories = caloriesPer100g(macros);
  const spoken = `${shown}, ${spokenKcal(calories)}, ${spokenGrams(macros.protein)} of protein per 100 grams`;
  return (
    <Row
      name={shown}
      detail={`${grams(macros.protein)} protein ${PER_100_G}`}
      figure={kcal(calories)}
      spoken={onLog ? `Log ${spoken}` : spoken}
      onPress={onLog}
      onDelete={onDelete}
    />
  );
}
