import type { Totals } from './dailyLog';

/** Where a day stands against its targets. */
export type Verdict = 'over budget' | 'slightly over' | 'on target' | 'in progress';

/** How far past its budget a day may go and be only slightly over. */
export const TOLERANCE = 0.1;

/**
 * A day's calories against its budget, both in kcal: how far from it, unrounded; whether past it, as
 * the verdict judges; and the share of it eaten, at most all of it.
 */
export function againstBudget(calories: number, budgetKcal: number) {
  return {
    kcal: Math.abs(budgetKcal - calories),
    over: calories > budgetKcal,
    share: Math.min(calories / budgetKcal, 1),
  };
}

/**
 * A day's Known protein against its Protein Floor, in g: still to go, or at least what is known when
 * some entries left it out; and the share of the floor reached, at most all of it.
 */
export type AgainstFloor =
  | { standing: 'to go' | 'at least'; grams: number; share: number }
  | { standing: 'met' | 'not stated'; share: number };

export function againstFloor(
  totals: Pick<Totals, 'protein' | 'proteinStated'>,
  floorG: number,
): AgainstFloor {
  // Protein nobody stated is not known to be anything; it is never 0 g.
  const protein = totals.protein;
  if (protein === undefined) return { standing: 'not stated', share: 0 };
  if (protein >= floorG) return { standing: 'met', share: 1 };
  const share = protein / floorG;
  // What some entries left out is not known, so how much is still to go is not either.
  if (totals.proteinStated === 'some') return { standing: 'at least', grams: protein, share };
  return { standing: 'to go', grams: floorG - protein, share };
}

/** Judges a day's totals against the targets of the review it is held to. */
export function dayVerdict(
  totals: Totals,
  targets: { budgetKcal: number; proteinFloorG: number },
): Verdict {
  const { over } = againstBudget(totals.calories, targets.budgetKcal);
  if (over && totals.calories > targets.budgetKcal * (1 + TOLERANCE)) return 'over budget';
  if (over) return 'slightly over';
  if (againstFloor(totals, targets.proteinFloorG).standing === 'met') return 'on target';
  return 'in progress';
}
