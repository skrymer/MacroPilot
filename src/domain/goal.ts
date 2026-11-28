/** The energy in a kg of body fat, which a rate of loss is reckoned in. */
const KCAL_PER_KG = 7700;

const DAYS_A_WEEK = 7;

/**
 * A weight to lose down to, at a rate: from the Trend Weight on the day it was set, as
 * `2026-11-24`. One at a time; setting another replaces it.
 */
export type Goal = { setOn: string; startKg: number; targetKg: number; rateKgPerWeek: number };

/** A Goal set on `day`, from the Trend Weight and maintenance then. */
export function newGoal(
  said: { targetKg: number; rateKgPerWeek: number },
  now: { trendKg: number; maintenanceKcal: number },
  day: string,
): Goal {
  if (!isTarget(said.targetKg, now.trendKg)) {
    throw new Error('A Goal needs a target above 0 and below the Trend Weight');
  }
  if (!isRate(said.rateKgPerWeek)) {
    throw new Error(`A rate is from ${MIN_RATE_KG_A_WEEK} to ${MAX_RATE_KG_A_WEEK} kg a week`);
  }
  if (!leavesFood(said.rateKgPerWeek, now.maintenanceKcal)) {
    throw new Error('A rate whose deficit reaches maintenance leaves nothing to eat');
  }
  return {
    setOn: day,
    startKg: now.trendKg,
    targetKg: said.targetKg,
    rateKgPerWeek: said.rateKgPerWeek,
  };
}

/** In kg a week: slower than this a Goal is maintenance in all but name. */
export const MIN_RATE_KG_A_WEEK = 0.05;

/** In kg a week: faster than this risks losing muscle. */
export const MAX_RATE_KG_A_WEEK = 1.5;

/** In kg a week, the ends included. */
export const isRate = (rateKgPerWeek: number) =>
  rateKgPerWeek >= MIN_RATE_KG_A_WEEK && rateKgPerWeek <= MAX_RATE_KG_A_WEEK;

/** Which end of the rates a rate, in kg a week, is past: slower than the least, or faster than the most. */
export const ratePast = (rateKgPerWeek: number): 'least' | 'most' | undefined =>
  rateKgPerWeek < MIN_RATE_KG_A_WEEK
    ? 'least'
    : rateKgPerWeek > MAX_RATE_KG_A_WEEK
      ? 'most'
      : undefined;

/** In kg: a weight to lose down to, from the Trend Weight. */
export const isTarget = (targetKg: number, trendKg: number) => targetKg > 0 && targetKg < trendKg;

/** Whether a rate, in kg a week, leaves anything of a maintenance, in kcal a day, to eat. */
export const leavesFood = (rateKgPerWeek: number, maintenanceKcal: number) =>
  dailyDeficit(rateKgPerWeek) < maintenanceKcal;

/**
 * Whether a running Goal's deficit is a Suspended Deficit at a maintenance, in kcal a day: there is a
 * Goal, and the maintenance cannot carry its deficit. No Goal, nothing suspended.
 */
export const isSuspended = (goal: Goal | undefined, maintenanceKcal: number) =>
  goal !== undefined && !leavesFood(goal.rateKgPerWeek, maintenanceKcal);

/** The kcal a day a rate of loss takes, in kg a week. */
export const dailyDeficit = (rateKgPerWeek: number) => (rateKgPerWeek * KCAL_PER_KG) / DAYS_A_WEEK;
