import { z } from 'zod';

import { isWeight, MAX_WEIGHT_KG, MIN_WEIGHT_KG } from '@/domain/weighIn';

import { optionalFigure } from './figureText';

/** A weight as it is typed, in kg. */
export const weightForm = z.object({
  kg: optionalFigure
    .pipe(z.number('Enter your weight in kg'))
    .refine(isWeight, `Enter a weight from ${MIN_WEIGHT_KG} to ${MAX_WEIGHT_KG} kg`),
});
