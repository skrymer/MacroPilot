import type { WeighIn } from './weighIn';

/** How much of the trend a day without a new weigh-in keeps: it takes a tenth of the way each day. */
const KEPT_A_DAY = 0.9;

const MS_PER_DAY = 86_400_000;

/** Whole days from one date to another, both as `2026-11-24`. */
const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);

/**
 * The user's weight with the day-to-day noise smoothed out, in kg, from weigh-ins oldest first: the
 * first, then moved toward each later one, a tenth of the way for every day since the last,
 * compounding. Days without a weigh-in are not filled in. Unrounded; none before the first.
 */
export function trendWeight(weighIns: readonly WeighIn[]): number | undefined {
  const [first, ...later] = weighIns;
  if (first === undefined) return undefined;
  let trend = first.kg;
  let last = first.day;
  for (const { day, kg } of later) {
    const kept = KEPT_A_DAY ** daysBetween(last, day);
    trend = kept * trend + (1 - kept) * kg;
    last = day;
  }
  return trend;
}
