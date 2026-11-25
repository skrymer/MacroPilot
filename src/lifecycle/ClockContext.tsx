import { createContext, useContext, type ReactNode } from 'react';

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
