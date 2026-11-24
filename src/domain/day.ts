const MS_PER_MINUTE = 60_000;

/** The date a phone shows at `now`, as `2026-11-24`, with its clock so many minutes ahead of UTC then. */
export function dayOf(now: number, utcOffsetMinutes: number): string {
  return new Date(now + utcOffsetMinutes * MS_PER_MINUTE).toISOString().slice(0, 10);
}
