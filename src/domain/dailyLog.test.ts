import { totalsOf } from './dailyLog';

describe('totalsOf', () => {
  it.each([
    ['nothing', [], { calories: 0, protein: 0 }],
    ['one entry', [{ calories: 235.2, protein: 10.4 }], { calories: 235.2, protein: 10.4 }],
    [
      'several, one of them all zeros',
      [
        { calories: 235.4, protein: 10.4 },
        { calories: 0, protein: 0 },
        { calories: 100.4, protein: 20.5 },
      ],
      { calories: 335.8, protein: 30.9 },
    ],
  ])('sums a day of %s, unrounded', (_, entries, totals) => {
    // Given a day's entries
    const day = entries;

    // When it is totalled
    const totalled = totalsOf(day);

    // Then it is what its entries add up to
    expect(totalled.calories).toBeCloseTo(totals.calories, 10);
    expect(totalled.protein).toBeCloseTo(totals.protein, 10);
  });
});
