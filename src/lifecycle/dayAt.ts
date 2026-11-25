import { dayOf } from '@/domain/day';

import type { Clock } from './Clock';

/** The phone's day at `now`, with its offset then. */
export const dayAt = (clock: Clock, now: number) => dayOf(now, clock.utcOffsetMinutes(now));
