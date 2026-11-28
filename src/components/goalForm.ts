import { z } from 'zod';

import { optionalFigure } from './figureText';

/** A Goal as it is typed: a target weight in kg and a rate in kg a week. */
export const goalForm = () =>
  z.object({
    targetKg: optionalFigure,
    rateKgPerWeek: optionalFigure,
  });
