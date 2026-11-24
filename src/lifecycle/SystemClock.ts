import type { Clock } from './Clock';

/**
 * The phone's own clock: the one module allowed to read the wall clock. Wall time on purpose: the
 * rules it serves span the app being suspended, and iOS's monotonic clock stops while the phone
 * sleeps, which would misplace a day's end. The price is a jump when the clock is set by hand.
 */
export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }

  utcOffsetMinutes(at: number): number {
    return -new Date(at).getTimezoneOffset();
  }

  after(ms: number, call: () => void): () => void {
    const timer = setTimeout(call, ms);
    return () => clearTimeout(timer);
  }
}
