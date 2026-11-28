const MS_PER_MINUTE = 60_000;

const MS_PER_DAY = 86_400_000;

/** Whole days from one date to another, both as `2026-11-24`. */
export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);

/**
 * The same date `years` earlier, both as `2026-11-24`. A 29 February lands on the 28th in a year
 * without one.
 */
export function yearsBefore(day: string, years: number): string {
  const year = Number(day.slice(0, 4)) - years;
  const leap = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;
  const monthDay = day.slice(5) === '02-29' && !leap ? '02-28' : day.slice(5);
  return `${year}-${monthDay}`;
}

/** The date a phone shows at `now`, as `2026-11-24`, with its clock so many minutes ahead of UTC then. */
export function dayOf(now: number, utcOffsetMinutes: number): string {
  return new Date(now + utcOffsetMinutes * MS_PER_MINUTE).toISOString().slice(0, 10);
}
