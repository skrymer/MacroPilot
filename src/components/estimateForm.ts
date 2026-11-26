import { z } from 'zod';

import { isEstimatedCalories, isLabel, LEAST_ESTIMATED_CALORIES } from '@/domain/entry';

import { optionalAmount } from './figureText';

/** An estimate as it is typed. */
export const estimateForm = z.object({
  label: z.string().refine(isLabel, 'Enter a label for this entry'),
  calories: optionalAmount('Calories')
    .pipe(z.number('Enter an estimated calorie figure'))
    .refine(isEstimatedCalories, `Calories must be at least ${LEAST_ESTIMATED_CALORIES}`),
  protein: optionalAmount('Protein'),
});
