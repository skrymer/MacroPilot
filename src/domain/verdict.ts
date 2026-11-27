import type { Totals } from './dailyLog';

/** Where a day stands against its targets. */
export type Verdict = 'over budget' | 'slightly over' | 'on target' | 'in progress';

/** How far past its budget a day may go and be only slightly over. */
export const TOLERANCE = 0.1;

/** Judges a day's totals against the targets of the review it is held to. */
export function dayVerdict(
  totals: Totals,
  targets: { budgetKcal: number; proteinFloorG: number },
): Verdict {
  if (totals.calories > targets.budgetKcal * (1 + TOLERANCE)) return 'over budget';
  if (totals.calories > targets.budgetKcal) return 'slightly over';
  if ((totals.protein ?? 0) >= targets.proteinFloorG) return 'on target';
  return 'in progress';
}
