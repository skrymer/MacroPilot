/** Grams of each per 100 g of a food. Fibre and alcohol are undefined where not stated, which is not zero. */
export type Macros = {
  protein: number;
  carbohydrate: number;
  fat: number;
  fibre?: number;
  alcohol?: number;
};

export type NewFood = { name: string; macros: Macros };

export type Food = NewFood & { id: number };

/** Ignoring case, in the phone's own alphabet; foods of one name stay in the order they came in. */
export function inNameOrder(foods: readonly Food[]): Food[] {
  const { compare } = new Intl.Collator(undefined, { sensitivity: 'accent' });
  return [...foods].sort((a, b) => compare(a.name.trim(), b.name.trim()));
}

export const isFoodName = (name: string) => name.trim() !== '';

/** Of grams or calories: none is an amount. */
export const isAmount = (figure: number) => Number.isFinite(figure) && figure >= 0;

/** The name is kept as typed. */
export function newFood(food: NewFood): NewFood {
  if (!isFoodName(food.name)) throw new Error('A food needs a name');
  // Not stated is judged as nothing wrong for these two alone: the others are always stated.
  const { fibre = 0, alcohol = 0 } = food.macros;
  for (const [macro, grams] of Object.entries({ ...food.macros, fibre, alcohol })) {
    if (!isAmount(grams)) throw new Error(`${macro} must be 0 or more`);
  }
  return food;
}

const KCAL_PER_GRAM: Required<Macros> = {
  protein: 4,
  carbohydrate: 4,
  fat: 9,
  fibre: 2,
  alcohol: 7,
};

/** Unrounded. A figure not stated adds none. */
export function caloriesPer100g({ protein, carbohydrate, fat, fibre, alcohol }: Macros): number {
  return (
    KCAL_PER_GRAM.protein * protein +
    KCAL_PER_GRAM.carbohydrate * carbohydrate +
    KCAL_PER_GRAM.fat * fat +
    KCAL_PER_GRAM.fibre * (fibre ?? 0) +
    KCAL_PER_GRAM.alcohol * (alcohol ?? 0)
  );
}
