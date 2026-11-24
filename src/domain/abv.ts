/** Ethanol's density in g/ml, with the drink itself taken as 1 g/ml. */
const GRAMS_PER_PERCENT = 0.789;

export const MAX_ABV = 100;

export const isAbv = (abv: number) => abv >= 0 && abv <= MAX_ABV;

/** Grams of alcohol per 100 g of a drink, from the percent by volume its label states. */
export function alcoholPer100g(abv: number): number {
  if (!isAbv(abv)) throw new Error(`ABV must be 0 to ${MAX_ABV}`);
  return abv * GRAMS_PER_PERCENT;
}

/** Far past any label, and far above the division's noise. */
const ABV_DECIMALS = 1e6;

/** The percent by volume that kept grams of alcohol read as, so that a 13 typed is a 13 read. */
export function abvOf(grams: number): number {
  return Math.round((grams / GRAMS_PER_PERCENT) * ABV_DECIMALS) / ABV_DECIMALS;
}
