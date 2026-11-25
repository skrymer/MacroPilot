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

  it.each([
    ['nothing', [], false],
    ['estimates alone', [{ label: 'lunch' }, { label: 'cake' }], true],
    ['weighed entries alone', [{}, {}], false],
    ['one weighed entry among estimates', [{ label: 'lunch' }, {}, { label: 'cake' }], false],
    ['one whose label is not stated', [{ label: undefined }], false],
  ])('knows whether a day of %s is an estimate', (_, kinds, estimated) => {
    // Given a day's entries, an estimate by its label
    const day = kinds.map((kind) => ({ calories: 100, protein: 1, ...kind }));

    // When it is totalled
    const totalled = totalsOf(day);

    // Then it is an estimate where nothing in it was weighed
    expect(totalled.estimated).toBe(estimated);
  });

  it.each([
    ['nothing', [], 0, 'all'],
    ['entries that all state it, one of them none', [10.4, 0], 10.4, 'all'],
    ['entries of which one does not state it', [10.4, undefined, 20], 30.4, 'some'],
    ['entries of which none states it', [undefined, undefined], undefined, 'none'],
    ['one that states it as none, and one that does not', [0, undefined], 0, 'some'],
  ])('knows the protein of a day of %s', (_, proteins, protein, stated) => {
    // Given a day's entries, each with its protein or without
    const day = proteins.map((stated) => ({ calories: 100, protein: stated }));

    // When it is totalled
    const totalled = totalsOf(day);

    // Then its protein is what is stated, with how many state theirs, and its calories are every one's
    expect(totalled.protein).toBe(protein);
    expect(totalled.proteinStated).toBe(stated);
    expect(totalled.calories).toBe(100 * day.length);
  });
});
