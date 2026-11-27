import { ageOn, type Profile } from './profile';

/** A fixed activity factor, lightly active, that errs low: the log corrects it (ADR 0012). */
const SEED_FACTOR = 1.4;

/** Mifflin-St Jeor's offset for each sex. */
const SEX_OFFSET = { male: 5, female: -161 } as const;

/**
 * The kcal a day the user burns, seeded by formula before there is a history to learn it from: the
 * Mifflin-St Jeor basal rate on the Trend Weight and the age on `on`, as `2026-11-24`, times 1.4.
 * Unrounded.
 */
export function seedMaintenance(profile: Profile, trendKg: number, on: string): number {
  const basal =
    10 * trendKg + 6.25 * profile.heightCm - 5 * ageOn(profile.born, on) + SEX_OFFSET[profile.sex];
  return basal * SEED_FACTOR;
}
