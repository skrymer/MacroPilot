import type { Clock } from './Clock';

const MS_PER_MINUTE = 60_000;

/** A time to the minute. The hours are 0 to 23, or midnight is an hour 24 of the day before. */
const SHOWN = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
} as const;

/**
 * The phone's own clock: the one module allowed to read the wall clock. Wall time on purpose: the
 * rules it serves span the app being suspended, and iOS's monotonic clock stops while the phone
 * sleeps, which would misplace a day's end. The price is a jump when the clock is set by hand.
 */
export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }

  /** Asked of `Intl`, which follows the phone: on Android a `Date` keeps the zone the app opened in. */
  utcOffsetMinutes(at: number): number {
    const shown: Record<string, number> = {};
    const format = new Intl.DateTimeFormat('en-US', SHOWN);
    for (const { type, value } of format.formatToParts(at)) shown[type] = Number(value);
    const { year = 0, month = 0, day = 0, hour = 0, minute = 0 } = shown;
    const local = Date.UTC(year, month - 1, day, hour, minute);
    return local / MS_PER_MINUTE - Math.floor(at / MS_PER_MINUTE);
  }

  after(ms: number, call: () => void): () => void {
    const timer = setTimeout(call, ms);
    return () => clearTimeout(timer);
  }
}
