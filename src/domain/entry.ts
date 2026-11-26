import { caloriesPer100g, isAmount, type Food } from './food';

/** What was eaten of a Food on a day, its figures as they were when it was logged. */
export type WeighedEntry = {
  day: string;
  foodId: number;
  grams: number;
  calories: number;
  protein: number;
};

/** What was eaten on a day and could not be weighed. Protein is undefined where not stated, which is not zero. */
export type EstimatedEntry = {
  day: string;
  label: string;
  calories: number;
  protein?: number;
};

export type Entry = WeighedEntry | EstimatedEntry;

/** An estimate is the one with a label of its own. */
export function isEstimated(entry: { calories: number; label?: string }): entry is EstimatedEntry {
  return entry.label !== undefined;
}

export const isLabel = (label: string) => label.trim() !== '';

/** The fewest calories an estimate has: one under it would read *about 0 kcal* (the user's word, 26 November 2026). */
export const LEAST_ESTIMATED_CALORIES = 1;

export const isEstimatedCalories = (calories: number) =>
  isAmount(calories) && calories >= LEAST_ESTIMATED_CALORIES;

/** The label is kept as typed. */
export function estimatedEntry(estimate: Omit<EstimatedEntry, 'day'>, day: string): EstimatedEntry {
  const { label, calories, protein } = estimate;
  if (!isLabel(label)) throw new Error('An estimate needs a label');
  if (!isEstimatedCalories(calories)) {
    throw new Error(`calories must be ${LEAST_ESTIMATED_CALORIES} or more`);
  }
  if (protein !== undefined && !isAmount(protein)) throw new Error('protein must be 0 or more');
  return { day, label, calories, protein };
}

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
