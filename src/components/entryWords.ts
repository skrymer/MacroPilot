import type { Totals } from '@/domain/dailyLog';
import { isEstimated, type Entry } from '@/domain/entry';

import { grams, kcal, spokenGrams, spokenKcal, talliedKcal } from './figures';

const protein = (stated?: number) =>
  stated === undefined ? 'protein not stated' : `${grams(stated)} protein`;

const spokenProtein = (stated?: number) =>
  stated === undefined ? 'protein not stated' : `${spokenGrams(stated)} of protein`;

/** An estimate's says that it is one, and is set as one (DESIGN.md, *Figures*). */
const calorieWords = (calories: number, estimated: boolean, show = kcal) => ({
  shown: `${estimated ? 'about ' : ''}${show(calories)}`,
  spoken: `${estimated ? 'about ' : ''}${spokenKcal(calories)}`,
  kind: (estimated ? 'estimated' : 'weighed') as 'weighed' | 'estimated',
});

/** A day's totals as its card shows them, and as a screen reader says them. */
export function totalsWords({ calories, protein: stated, proteinStated, estimated }: Totals) {
  const atLeast = proteinStated === 'some' ? 'at least ' : '';
  const { shown, kind } = calorieWords(calories, estimated);
  // The kinds of figure in DESIGN.md, *Figures*.
  const proteinKind: 'weighed' | 'notStated' = stated === undefined ? 'notStated' : 'weighed';
  return {
    caloriesKind: kind,
    proteinKind,
    calories: shown,
    protein: `${atLeast}${protein(stated)}`,
    spoken: `${estimated ? 'About ' : ''}${spokenKcal(calories)}, ${atLeast}${spokenProtein(stated)}`,
  };
}

/**
 * How many entries a day has and what they come to, as it is headed and as a screen reader says it. The
 * calories stand apart, to be set as a total is, by the surest kind in them.
 */
export function tallyWords(count: number, { calories, estimated }: Totals) {
  const entries = `${count} ${count === 1 ? 'entry' : 'entries'}`;
  const { shown, spoken, kind } = calorieWords(calories, estimated, talliedKcal);
  return { count: entries, calories: shown, caloriesKind: kind, spoken: `${entries}, ${spoken}` };
}

/** An entry's figures in a line: an estimate's without the protein it does not state. */
export function entryFigures(entry: Entry) {
  const estimated = isEstimated(entry);
  const { shown, spoken } = calorieWords(entry.calories, estimated);
  const stated = entry.protein !== undefined;
  return {
    shown: [
      ...(estimated ? [] : [grams(entry.grams)]),
      shown,
      ...(stated ? [protein(entry.protein)] : []),
    ].join(', '),
    spoken: [
      ...(estimated ? [] : [spokenGrams(entry.grams)]),
      spoken,
      ...(stated ? [spokenProtein(entry.protein)] : []),
    ].join(', '),
  };
}

/** An entry as a row shows it, and as a screen reader says it under the name it is shown by. */
export function entryWords(name: string, entry: Entry) {
  const estimated = isEstimated(entry);
  const { shown, spoken } = calorieWords(entry.calories, estimated);
  const [how, spokenHow] = estimated
    ? ['Estimate', 'estimate']
    : [grams(entry.grams), spokenGrams(entry.grams)];
  return {
    estimated,
    detail: `${how}, ${protein(entry.protein)}`,
    figure: shown,
    spoken: `${name}, ${spokenHow}, ${spoken}, ${spokenProtein(entry.protein)}`,
  };
}
