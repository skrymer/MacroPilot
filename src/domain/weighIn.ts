/** In kg: under this a weight is a slip, not a body. */
export const MIN_WEIGHT_KG = 20;

/** In kg: over this, the same. */
export const MAX_WEIGHT_KG = 400;

/** The user's weight on one day, as `2026-11-24`. A day has at most one. */
export type WeighIn = { day: string; kg: number };

/** Judged on `today`, as `2026-11-24`. */
export function newWeighIn(weighIn: WeighIn, today: string): WeighIn {
  if (weighIn.day > today) throw new Error('A weigh-in is for today or a day before it');
  if (!isWeight(weighIn.kg)) throw new Error('A weight is from 20 to 400 kg');
  return weighIn;
}

/** In kg, the ends included. */
export const isWeight = (kg: number) => kg >= MIN_WEIGHT_KG && kg <= MAX_WEIGHT_KG;
