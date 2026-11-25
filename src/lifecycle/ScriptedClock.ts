import type { Clock } from './Clock';

/** A `Clock` a test moves on by hand. It starts at zero, on UTC. */
export class ScriptedClock implements Clock {
  private time = 0;
  private offset = 0;
  private scheduled: { at: number; call: () => void }[] = [];

  now(): number {
    return this.time;
  }

  utcOffsetMinutes(_at?: number): number {
    return this.offset;
  }

  /** Sets the phone `minutes` ahead of UTC, the same at every time. */
  setUtcOffset(minutes: number): void {
    this.offset = minutes;
  }

  after(ms: number, call: () => void): () => void {
    const entry = { at: this.time + ms, call };
    this.scheduled.push(entry);
    return () => {
      this.scheduled = this.scheduled.filter((scheduled) => scheduled !== entry);
    };
  }

  /** Time goes by with the phone asleep, and does not count towards any call. */
  sleep(ms: number): void {
    this.time += ms;
    for (const scheduled of this.scheduled) scheduled.at += ms;
  }

  /** Moves the clock on, running each call that falls due on the way at the time it was due. */
  advance(ms: number): void {
    const until = this.time + ms;
    for (;;) {
      const due = this.scheduled
        .filter((entry) => entry.at <= until)
        .sort((a, b) => a.at - b.at)[0];
      if (due === undefined) break;
      this.scheduled = this.scheduled.filter((entry) => entry !== due);
      this.time = due.at;
      due.call();
    }
    this.time = until;
  }
}
