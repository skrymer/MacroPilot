import { totalsOf } from '@/domain/dailyLog';

import { totalsWords } from './entryWords';

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
