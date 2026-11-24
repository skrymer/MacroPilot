import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';

import type { Clock } from './Clock';

const ClockContext = createContext<Clock | null>(null);

/** Hands screens their `Clock`, so a test can move time on without waiting. */
export function ClockProvider({ clock, children }: { clock: Clock; children: ReactNode }) {
  return <ClockContext.Provider value={clock}>{children}</ClockContext.Provider>;
}

export function useClock(): Clock {
  const clock = useContext(ClockContext);
  if (clock === null) throw new Error('useClock needs a ClockProvider');
  return clock;
}

/**
 * The clock, read on every render. Reading it is not pure, and the React Compiler assumes a render
 * is: it would memoise `clock.now()` on a clock that never changes, and the reading would never move.
 * Given `untilChanges`, a timer prompts a redraw when what the screen shows from the reading would
 * next differ; it may be late, so it never stands for a reading.
 */
export function useNow(untilChanges?: (now: number) => number): number {
  'use no memo';
  const clock = useClock();
  const [, prompt] = useReducer((n: number) => n + 1, 0);
  const now = clock.now();
  // Keyed on when the next change is due, not on the reading: a redraw for any other reason within
  // the same stretch leaves the timer armed rather than re-arming it.
  const due = untilChanges ? now + untilChanges(now) : undefined;
  useEffect(
    () => (due === undefined ? undefined : clock.after(due - clock.now(), prompt)),
    [clock, due],
  );
  return now;
}
