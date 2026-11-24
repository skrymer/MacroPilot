/** The time, injected so a rule about how long something lasted is tested without waiting. */
export interface Clock {
  /** Milliseconds since an arbitrary start. Only differences between two readings mean anything. */
  now(): number;

  /**
   * How many minutes ahead of UTC the phone's clock was at `at`, a reading of `now`: what a day or a
   * time of day is shown on. Asked per reading, since summer time moves it.
   */
  utcOffsetMinutes(at: number): number;

  /**
   * Calls `call` once, `ms` from now. Returns a function that cancels it. On the phone it is late
   * while the app is suspended, so it only prompts a fresh reading of `now`, never stands for one.
   */
  after(ms: number, call: () => void): () => void;
}
