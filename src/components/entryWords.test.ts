import { totalsOf } from '@/domain/dailyLog';

import { tallyWords, totalsWords } from './entryWords';

/** The no-break space between a figure and its unit (DESIGN.md, *Figures*). */
const NBSP = String.fromCharCode(0xa0);

describe('totalsWords', () => {
  it.each([
    ['nothing', [], 'weighed', 'weighed'],
    [
      'estimates that state no protein',
      [{ label: 'lunch', calories: 1 }],
      'estimated',
      'notStated',
    ],
    ['estimates that state 0', [{ label: 'x', calories: 1, protein: 0 }], 'estimated', 'weighed'],
    [
      'an estimate that states none beside a weighed entry',
      [
        { label: 'lunch', calories: 1 },
        { calories: 1, protein: 1 },
      ],
      'weighed',
      'weighed',
    ],
  ])('says the kind of figure each total of %s is', (_, entries, calories, protein) => {
    // Given a day's totals
    const totals = totalsOf(entries);

    // When they are put in words
    const words = totalsWords(totals);

    // Then each says how it is to be set, an absence apart from a figure
    expect(words.caloriesKind).toBe(calories);
    expect(words.proteinKind).toBe(protein);
  });
});

describe('tallyWords', () => {
  it.each([
    [
      'a weighed entry beside an estimate',
      [
        { calories: 1000, protein: 1 },
        { label: 'x', calories: 425 },
      ],
      `1,425${NBSP}kcal`,
      'weighed',
    ],
    ['estimates alone', [{ label: 'x', calories: 850 }], `about 850${NBSP}kcal`, 'estimated'],
  ])(
    'gives the calories of %s apart, as a figure of the surest kind in them',
    (_, entries, calories, kind) => {
      // Given a day's totals
      const totals = totalsOf(entries);

      // When they are tallied
      const words = tallyWords(entries.length, totals);

      // Then the calories stand apart from the count, to be set as a total is
      expect(words.calories).toBe(calories);
      expect(words.caloriesKind).toBe(kind);
      expect(words.count).toBe(entries.length === 1 ? '1 entry' : `${entries.length} entries`);
    },
  );
});
