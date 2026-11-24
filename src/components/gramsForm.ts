import { z } from 'zod';

import { isPortion } from '@/domain/entry';

import { optionalFigure } from './figureText';

/** The grams eaten of a food, as they are typed. */
export const gramsForm = z.object({
  grams: optionalFigure
    .pipe(z.number('Enter the weight in grams'))
    .refine(isPortion, 'Grams must be greater than 0'),
});
