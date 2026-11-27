import { z } from 'zod';

import { isBirthDate, isHeight } from '@/domain/profile';

import { optionalFigure } from './figureText';

/** The details as they are given on `today`, as `2026-11-24`: a birth date is judged on the day. */
export const detailsForm = (today: string) =>
  z.object({
    sex: z.enum(['male', 'female'], 'Choose your sex'),
    born: z
      .string()
      .min(1, 'Choose your birth date')
      .refine(
        (born) => isBirthDate(born, today),
        'Choose a birth date before today, within the last 120 years',
      ),
    heightCm: optionalFigure
      .pipe(z.number('Enter your height in cm'))
      .refine(isHeight, 'Enter a height above 0 and below 300 cm'),
    countsCalories: z.boolean(),
  });
