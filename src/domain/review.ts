import { seedMaintenance } from './maintenance';
import type { Profile } from './profile';
import { trendWeight } from './trend';
import type { WeighIn } from './weighIn';

/**
 * The dated decision of what a day's targets are, with the Trend Weight they were set from. All in
 * kcal, g and kg, unrounded.
 */
export type Review = {
  /** As `2026-11-24`. */
  day: string;
  trendKg: number;
  maintenanceKcal: number;
  budgetKcal: number;
  proteinFloorG: number;
};

/** The review `day`, as `2026-11-24`, is held to: the latest dated on or before it, if any. */
export const reviewFor = (reviews: readonly Review[], day: string): Review | undefined =>
  reviews
    .filter((review) => review.day <= day)
    .reduce<Review | undefined>(
      (latest, review) => (latest === undefined || review.day > latest.day ? review : latest),
      undefined,
    );

/**
 * The review to run now, if one is due: none before Setup; the first once Setup completes, whichever
 * came second; and today's again when today's weigh-in has been replaced. A change of height or birth
 * date runs none (ADR 0012), and neither do details whose seeded maintenance is not above 0.
 */
export function reviewDue({
  profile,
  weighIns,
  reviews,
  today,
  replacedToday = false,
}: {
  profile: Profile | undefined;
  weighIns: readonly WeighIn[];
  reviews: readonly Review[];
  today: string;
  /** Today's weigh-in was just saved over one already there. */
  replacedToday?: boolean;
}): Review | undefined {
  if (profile === undefined || weighIns.length === 0) return undefined;
  if (reviews.length > 0 && !replacedToday) return undefined;
  // A maintenance not above 0 is no measurement of anyone: no targets are set from it.
  const review = newReview(profile, weighIns, today);
  return review.maintenanceKcal > 0 ? review : undefined;
}

/** The protein a day should reach at least, per kg of Trend Weight. */
const PROTEIN_G_PER_KG = 2;

/**
 * The review run on `day`, as `2026-11-24`, from the Profile and the weigh-ins oldest first. Without a
 * Goal the budget is maintenance. Setup must be complete: there is no review without a weigh-in.
 */
export function newReview(profile: Profile, weighIns: readonly WeighIn[], day: string): Review {
  const trendKg = trendWeight(weighIns);
  if (trendKg === undefined) throw new Error('A review needs a weigh-in');
  const maintenanceKcal = seedMaintenance(profile, trendKg, day);
  return {
    day,
    trendKg,
    maintenanceKcal,
    budgetKcal: maintenanceKcal,
    proteinFloorG: PROTEIN_G_PER_KG * trendKg,
  };
}
