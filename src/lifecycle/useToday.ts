import { useCallback, useSyncExternalStore } from 'react';

import { useClock } from './ClockContext';
import { dayAt } from './dayAt';

/** More than a second: iOS runs on every frame while the next timer is no further off than that. */
const LOOKED_AT_EVERY_MS = 2_000;

/**
 * The phone's day, looked at this often and drawn again only where it is another: at midnight, or where
 * the phone is moved to another zone. No timer is set to midnight itself, since a phone counts no time
 * asleep towards one, and after a night it would be hours late.
 */
export function useToday(): string {
  const clock = useClock();
  const subscribe = useCallback(
    (look: () => void) => {
      let stop = () => {};
      const lookLater = () => {
        stop = clock.after(LOOKED_AT_EVERY_MS, () => {
          look();
          lookLater();
        });
      };
      lookLater();
      return () => stop();
    },
    [clock],
  );
  return useSyncExternalStore(subscribe, () => dayAt(clock, clock.now()));
}
