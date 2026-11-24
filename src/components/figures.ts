/**
 * A figure as it is shown: whole, and joined to its unit by a no-break space, since Android can break
 * the line at an ordinary one and clip what follows.
 */
export const kcal = (calories: number) => `${Math.round(calories)} kcal`;

export const grams = (weight: number) => `${Math.round(weight)} g`;

/** A figure as a screen reader says it, its unit a word. */
const spoken = (figure: number, unit: string) =>
  `${Math.round(figure)} ${unit}${Math.round(figure) === 1 ? '' : 's'}`;

export const spokenKcal = (calories: number) => spoken(calories, 'calorie');

export const spokenGrams = (weight: number) => spoken(weight, 'gram');
