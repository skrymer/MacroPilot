import { caloriesPer100g, type Food } from './food';

/** What was eaten of a Food on a day, its figures as they were when it was logged. */
export type WeighedEntry = {
  day: string;
  foodId: number;
  grams: number;
  calories: number;
  protein: number;
};

export const isPortion = (grams: number) => Number.isFinite(grams) && grams > 0;

/** Unrounded. */
export function weighedEntry(food: Food, grams: number, day: string): WeighedEntry {
  if (!isPortion(grams)) throw new Error('grams must be more than 0');
  const eaten = (per100g: number) => (per100g * grams) / 100;
  return {
    day,
    foodId: food.id,
    grams,
    calories: eaten(caloriesPer100g(food.macros)),
    protein: eaten(food.macros.protein),
  };
}
