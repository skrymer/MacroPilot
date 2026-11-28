import { z } from 'zod';

import { isTarget, leavesFood, MAX_RATE_KG_A_WEEK, MIN_RATE_KG_A_WEEK } from '@/domain/goal';

import { optionalFigure } from './figureText';

/**
 * A Goal as it is typed: a target weight in kg and a rate in kg a week, judged against today's Trend
 * Weight and maintenance.
 */
export const goalForm = ({
  trendKg,
  maintenanceKcal,
}: {
  trendKg: number;
  maintenanceKcal: number;
}) =>
  z.object({
    targetKg: optionalFigure
      .pipe(z.number('Enter a target weight'))
      .refine(
        (targetKg) => isTarget(targetKg, trendKg),
        `A weight-loss goal needs a target below your current trend weight (${trendKg.toFixed(1)} kg)`,
      ),
    rateKgPerWeek: optionalFigure
      .pipe(z.number('Enter a weekly rate'))
      .refine(
        (rate) => rate >= MIN_RATE_KG_A_WEEK,
        `Rate must be at least ${MIN_RATE_KG_A_WEEK} kg a week`,
      )
      .refine(
        (rate) => rate <= MAX_RATE_KG_A_WEEK,
        `Rate must be at most ${MAX_RATE_KG_A_WEEK} kg a week`,
      )
      .refine((rate) => leavesFood(rate, maintenanceKcal), {
        error: ({ input }) =>
          `At your current maintenance of ${Math.round(maintenanceKcal)} kcal a day, ${input} kg a week would leave you nothing to eat — choose a slower rate`,
      }),
  });
