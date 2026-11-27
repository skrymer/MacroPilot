import { z } from 'zod';

import { birthDateFault, heightFault, MAX_AGE_YEARS, MAX_HEIGHT_CM } from '@/domain/profile';

import { optionalFigure } from './figureText';

const BIRTH_DATE_FAULTS = {
  'not past': 'Birth date must be in the past',
  'too long ago': `Birth date must be within the last ${MAX_AGE_YEARS} years`,
} as const;

const HEIGHT_FAULTS = {
  'not above zero': 'Height must be greater than 0',
  'not below the tallest': `Height must be less than ${MAX_HEIGHT_CM}`,
} as const;

/** The details as they are given on `today`, as `2026-11-24`: a birth date is judged on the day. */
export const detailsForm = (today: string) =>
  z.object({
    sex: z.enum(['male', 'female'], 'Choose your sex'),
    born: z
      .string()
      .min(1, { error: 'Enter your birth date', abort: true })
      .superRefine((born, context) => {
        const fault = birthDateFault(born, today);
        if (fault) context.addIssue(BIRTH_DATE_FAULTS[fault]);
      }),
    heightCm: optionalFigure
      .pipe(z.number('Enter your height in cm'))
      .superRefine((cm, context) => {
        const fault = heightFault(cm);
        if (fault) context.addIssue(HEIGHT_FAULTS[fault]);
      }),
    countsCalories: z.boolean(),
  });
