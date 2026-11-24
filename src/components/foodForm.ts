import { z } from 'zod';

import { isFoodName, isMacro } from '@/domain/food';

import { optionalFigure } from './figureText';

const macro = (name: string) =>
  optionalFigure
    .pipe(z.number(`Enter ${name.toLowerCase()} per 100 g`))
    .refine(isMacro, `${name} can’t be negative`);

/** A food as it is typed, in grams per 100 g. */
export const foodForm = z.object({
  name: z.string().refine(isFoodName, 'Enter a name'),
  protein: macro('Protein'),
  carbohydrate: macro('Carbohydrate'),
  fat: macro('Fat'),
});
