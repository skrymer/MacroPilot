/** Who the targets are worked out for. */
export type Profile = {
  sex: 'male' | 'female';
  /** As `1984-03-14`. */
  born: string;
  heightCm: number;
  /** On unless the user says they track their weight only. */
  countsCalories: boolean;
};

/** Judged on `today`, the day it is given, as `2026-11-24`. */
export function newProfile(profile: Profile, today: string): Profile {
  if (!isBirthDate(profile.born, today)) {
    throw new Error('A birth date is before today and at most 120 years ago');
  }
  if (!isHeight(profile.heightCm)) throw new Error('A height is above 0 and below 300 cm');
  return profile;
}

/** In cm: past the tallest anyone has been, a height is a slip of the decimal point. */
export const isHeight = (cm: number) => cm > 0 && cm < 300;

/** The oldest anyone can be: past it a birth date is a slip, not a life. */
const MAX_AGE_YEARS = 120;

/** Before `today` and at most 120 years before it, both dates as `2026-11-24`. */
export function isBirthDate(born: string, today: string): boolean {
  const earliest = `${Number(today.slice(0, 4)) - MAX_AGE_YEARS}${today.slice(4)}`;
  return born < today && born >= earliest;
}

/** Whole years from `born` to `on`, both dates as `2026-11-24`. */
export function ageOn(born: string, on: string): number {
  const years = Number(on.slice(0, 4)) - Number(born.slice(0, 4));
  return on.slice(5) < born.slice(5) ? years - 1 : years;
}
