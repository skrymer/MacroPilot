import { yearsBefore } from './day';

/** Who the targets are worked out for. */
export type Profile = {
  sex: 'male' | 'female';
  /** As `1984-03-14`. */
  born: string;
  heightCm: number;
  /** On unless the user says they track their weight only. */
  countsCalories: boolean;
};

/** The oldest anyone can be: past it a birth date is a slip, not a life. */
export const MAX_AGE_YEARS = 120;

/** In cm: a height this tall is a slip of the decimal point. */
export const MAX_HEIGHT_CM = 300;

/** Judged on `today`, the day it is given, as `2026-11-24`. */
export function newProfile(profile: Profile, today: string): Profile {
  if (!isBirthDate(profile.born, today)) {
    throw new Error('A birth date is before today and at most 120 years ago');
  }
  if (!isHeight(profile.heightCm)) throw new Error('A height is above 0 and below 300 cm');
  return profile;
}

/** Which rule a birth date breaks on `today`, if any: it is after yesterday, or more than 120 years back. */
export function birthDateFault(
  born: string,
  today: string,
): 'not past' | 'too long ago' | undefined {
  if (born >= today) return 'not past';
  if (born < yearsBefore(today, MAX_AGE_YEARS)) return 'too long ago';
  return undefined;
}

/** Which end a height in cm is past, if either. */
export function heightFault(cm: number): 'not above zero' | 'not below the tallest' | undefined {
  if (cm <= 0) return 'not above zero';
  if (cm >= MAX_HEIGHT_CM) return 'not below the tallest';
  return undefined;
}

export const isHeight = (cm: number) => heightFault(cm) === undefined;

/** Both dates as `2026-11-24`. */
export const isBirthDate = (born: string, today: string) =>
  birthDateFault(born, today) === undefined;

/** Whole years from `born` to `on`, both dates as `2026-11-24`. */
export function ageOn(born: string, on: string): number {
  const years = Number(on.slice(0, 4)) - Number(born.slice(0, 4));
  return on.slice(5) < born.slice(5) ? years - 1 : years;
}
