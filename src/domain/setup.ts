import type { Profile } from './profile';
import type { WeighIn } from './weighIn';

/** What Setup still lacks: details (a Profile), a weigh-in, both, or nothing once it is complete. */
export function missingForSetup(
  profile: Profile | undefined,
  weighIns: readonly WeighIn[],
): ('details' | 'weigh-in')[] {
  return [
    ...(profile === undefined ? (['details'] as const) : []),
    ...(weighIns.length === 0 ? (['weigh-in'] as const) : []),
  ];
}
