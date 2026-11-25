import { isEstimated } from './entry';

/** An entry's, whichever kind. */
type Figures = { calories: number; protein?: number; label?: string };

/** How many of a day's entries state their protein. */
type Stated = 'all' | 'some' | 'none';

export type Totals = {
  calories: number;
  /** What is stated of it, and undefined where no entry states any. */
  protein?: number;
  proteinStated: Stated;
  /** Where nothing in the day was weighed. */
  estimated: boolean;
};

const sum = (figures: readonly number[]) => figures.reduce((total, figure) => total + figure, 0);

/** What a day's entries add up to, unrounded. A day with none has 0 of each, which is known. */
export function totalsOf(entries: readonly Figures[]): Totals {
  const stated = entries.flatMap(({ protein }) => (protein === undefined ? [] : [protein]));
  const proteinStated =
    stated.length === entries.length ? 'all' : stated.length > 0 ? 'some' : 'none';
  return {
    calories: sum(entries.map(({ calories }) => calories)),
    protein: proteinStated === 'none' ? undefined : sum(stated),
    proteinStated,
    estimated: entries.length > 0 && entries.every(isEstimated),
  };
}
