import { estimatedEntry, weighedEntry } from './entry';

/** 294 kcal and 13 g protein per 100 g. */
const OATS = { id: 7, name: 'oats', macros: { protein: 13, carbohydrate: 20, fat: 18 } };

describe('estimatedEntry', () => {
  it('has the label, the calories and the protein it was given, not stated or stated', () => {
    // Given two estimates, one that states its protein
    const lunch = { label: 'pub LUNCH', calories: 850, protein: undefined };
    const broth = { label: 'broth', calories: 1, protein: 0 };

    // When each is logged on a day
    const entries = [lunch, broth].map((estimate) => estimatedEntry(estimate, '2026-11-24'));

    // Then each is as it was given, a zero still zero, with no food and no grams
    expect(entries).toStrictEqual([
      { day: '2026-11-24', label: 'pub LUNCH', calories: 850, protein: undefined },
      { day: '2026-11-24', label: 'broth', calories: 1, protein: 0 },
    ]);
  });

  it.each([
    ['a blank label', { label: '' }, 'needs a label'],
    ['a label of spaces', { label: ' \t ' }, 'needs a label'],
    ['calories under 1', { calories: 0.999 }, 'calories must be 1 or more'],
    ['negative calories', { calories: -0.1 }, 'calories must be 1 or more'],
    ['calories that are not a number', { calories: Number.NaN }, 'calories must be 1 or more'],
    ['endless calories', { calories: Infinity }, 'calories must be 1 or more'],
    ['negative protein', { protein: -0.1 }, 'protein must be 0 or more'],
    ['endless protein', { protein: Infinity }, 'protein must be 0 or more'],
  ])('refuses %s', (_, wrong, fault) => {
    // Given an estimate with one thing wrong
    const estimate = { label: 'pub lunch', calories: 850, protein: 30, ...wrong };

    // When it is logged
    const logging = () => estimatedEntry(estimate, '2026-11-24');

    // Then it is refused, for that
    expect(logging).toThrow(fault);
  });
});

describe('weighedEntry', () => {
  it('takes its calories and protein from its food, for the grams eaten', () => {
    // Given a food, and what was eaten of it
    const eaten = 80;

    // When it is logged on a day
    const entry = weighedEntry(OATS, eaten, '2026-11-24');

    // Then it has the food's figures for those grams, unrounded
    expect(entry).toEqual({
      day: '2026-11-24',
      foodId: 7,
      grams: 80,
      calories: 235.2,
      protein: 10.4,
    });
  });

  it.each([0, -0.1, Number.NaN, Number.POSITIVE_INFINITY])('refuses %s grams', (grams) => {
    // Given an amount nobody can have eaten
    const eaten = grams;

    // When it is logged
    const logging = () => weighedEntry(OATS, eaten, '2026-11-24');

    // Then it is refused
    expect(logging).toThrow('grams must be more than 0');
  });
});
