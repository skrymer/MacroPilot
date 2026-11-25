import { z } from 'zod';

import { isLabel } from '@/domain/entry';

import { optionalAmount } from './figureText';

/** An estimate as it is typed. */
export const estimateForm = z.object({
  label: z.string().refine(isLabel, 'Enter a label for this entry'),
  calories: optionalAmount('Calories').pipe(z.number('Enter an estimated calorie figure')),
  protein: optionalAmount('Protein'),
});
