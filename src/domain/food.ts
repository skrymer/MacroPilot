/** Grams of each per 100 g of a food. */
export type Macros = { protein: number; carbohydrate: number; fat: number };

export type NewFood = { name: string; macros: Macros };

export type Food = NewFood & { id: number };

/** Ignoring case, in the phone's own alphabet; foods of one name stay in the order they came in. */
export function inNameOrder(foods: readonly Food[]): Food[] {
  const { compare } = new Intl.Collator(undefined, { sensitivity: 'accent' });
  return [...foods].sort((a, b) => compare(a.name.trim(), b.name.trim()));
}

export const isFoodName = (name: string) => name.trim() !== '';

export const isMacro = (grams: number) => Number.isFinite(grams) && grams >= 0;

/** The name is kept as typed. */
export function newFood(food: NewFood): NewFood {
  if (!isFoodName(food.name)) throw new Error('A food needs a name');
  for (const [macro, grams] of Object.entries(food.macros)) {
    if (!isMacro(grams)) throw new Error(`${macro} must be 0 or more`);
  }
  return food;
}

const KCAL_PER_GRAM: Macros = { protein: 4, carbohydrate: 4, fat: 9 };

/** Unrounded. */
export function caloriesPer100g({ protein, carbohydrate, fat }: Macros): number {
  return (
    KCAL_PER_GRAM.protein * protein +
    KCAL_PER_GRAM.carbohydrate * carbohydrate +
    KCAL_PER_GRAM.fat * fat
  );
}
