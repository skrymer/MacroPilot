import { weighedEntry } from './entry';

/** 294 kcal and 13 g protein per 100 g. */
const OATS = { id: 7, name: 'oats', macros: { protein: 13, carbohydrate: 20, fat: 18 } };

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
