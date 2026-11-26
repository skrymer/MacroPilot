import { z } from 'zod';

import { alcoholPer100g, isAbv, MAX_ABV } from '@/domain/abv';
import { isFoodName, type NewFood } from '@/domain/food';

import { grams } from './figures';
import { optionalAmount } from './figureText';

const macro = (name: string) =>
  optionalAmount(name).pipe(z.number(`Enter ${name.toLowerCase()} per ${grams(100)}`));

/** A food as it is typed: grams per 100 g, with alcohol in percent by volume as a label gives it. */
export const foodForm = z.object({
  name: z.string().refine(isFoodName, 'Enter a name for this food'),
  protein: macro('Protein'),
  carbohydrate: macro('Carbohydrate'),
  fat: macro('Fat'),
  fibre: optionalAmount('Fibre'),
  abv: optionalAmount('Alcohol').refine(
    (abv) => abv === undefined || isAbv(abv),
    `ABV can’t be over ${MAX_ABV}%`,
  ),
});

/** The food a form said. Its figures are named one by one, so that no percent is kept as grams. */
export function foodOf(said: z.output<typeof foodForm>): NewFood {
  const { name, protein, carbohydrate, fat, fibre, abv } = said;
  const alcohol = abv === undefined ? undefined : alcoholPer100g(abv);
  return { name, macros: { protein, carbohydrate, fat, fibre, alcohol } };
}
