/**
 * A figure as it is shown: whole, and joined to its unit by a no-break space, since Android can break
 * the line at an ordinary one and clip what follows.
 */
export const kcal = (calories: number) => `${Math.round(calories)}\u00a0kcal`;

export const grams = (weight: number) => `${THOUSANDS.format(Math.round(weight))}\u00a0g`;

/** A day's calories in its tally, the one place they have their thousands apart. */
export const talliedKcal = (calories: number) => `${THOUSANDS.format(Math.round(calories))}\u00a0kcal`;

/** One for every figure: a formatter is slow to make, and a list shows hundreds. */
const THOUSANDS = new Intl.NumberFormat('en-US');

/** A figure as a screen reader says it, its unit a word. */
const spoken = (figure: number, unit: string) =>
  `${Math.round(figure)} ${unit}${Math.round(figure) === 1 ? '' : 's'}`;

export const spokenKcal = (calories: number) => spoken(calories, 'calorie');

export const spokenGrams = (weight: number) => spoken(weight, 'gram');
