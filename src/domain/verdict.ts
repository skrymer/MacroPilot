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

/** Judges a day's totals against the targets of the review it is held to. */
export function dayVerdict(
  totals: Totals,
  targets: { budgetKcal: number; proteinFloorG: number },
): Verdict {
  const { over } = againstBudget(totals.calories, targets.budgetKcal);
  if (over && totals.calories > targets.budgetKcal * (1 + TOLERANCE)) return 'over budget';
  if (over) return 'slightly over';
  // Protein not stated is not yet known to reach anything; it is never 0 g.
  if (totals.protein !== undefined && totals.protein >= targets.proteinFloorG) return 'on target';
  return 'in progress';
}
