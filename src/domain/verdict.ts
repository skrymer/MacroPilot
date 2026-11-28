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
  if (totals.protein === undefined) return { standing: 'not stated', share: 0 };
  const protein = keptGrams(totals.protein);
  const floor = keptGrams(floorG);
  if (protein >= floor) return { standing: 'met', share: 1 };
  const share = protein / floor;
  // What some entries left out is not known, so how much is still to go is not either.
  if (totals.proteinStated === 'some') return { standing: 'at least', grams: protein, share };
  // Kept again: subtracting two kept figures leaves noise of its own (124.3 − 100.1 = 24.19999…).
  return { standing: 'to go', grams: keptGrams(floor - protein), share };
}

/**
 * Grams as logged, free of the noise that adding and averaging leave in a float (124.00000000000001,
 * 80.99999999999999): kept to a millionth of a gram, far finer than anything weighed or shown.
 */
export const keptGrams = (grams: number) => Math.round(grams * 1e6) / 1e6;

/**
 * Where the day would stand with an entry being typed, once that passes the budget: how far past it,
 * unrounded, and which standing it would reach. Nothing under the budget, or with no figure typed.
 */
export function overLine(
  dayKcal: number,
  entryKcal: number | undefined,
  budgetKcal: number,
): { overKcal: number; standing: 'slightly over' | 'over budget' } | undefined {
  if (entryKcal === undefined) return undefined;
  const projected = dayKcal + entryKcal;
  const standing = pastBudget(projected, budgetKcal);
  return standing && { overKcal: againstBudget(projected, budgetKcal).kcal, standing };
}

/** How far past its budget a day's calories are: within its tenth, beyond it, or not past it at all. */
function pastBudget(calories: number, budgetKcal: number) {
  if (!againstBudget(calories, budgetKcal).over) return undefined;
  return calories > budgetKcal * (1 + TOLERANCE) ? 'over budget' : 'slightly over';
}

/** Judges a day's totals against the targets of the review it is held to. */
export function dayVerdict(
  totals: Totals,
  targets: { budgetKcal: number; proteinFloorG: number },
): Verdict {
  const past = pastBudget(totals.calories, targets.budgetKcal);
  if (past) return past;
  if (againstFloor(totals, targets.proteinFloorG).standing === 'met') return 'on target';
  return 'in progress';
}
