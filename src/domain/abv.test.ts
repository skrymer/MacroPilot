import { abvOf, alcoholPer100g } from './abv';

describe('abvOf', () => {
  it.each([0, 4.6, 13, 13.5, 100])('reads a kept %s%% as it was typed', (abv) => {
    // Given the grams a typed percent is kept as
    const grams = alcoholPer100g(abv);

    // When they are read
    const read = abvOf(grams);

    // Then the division's noise is not in it
    expect(read).toBe(abv);
  });
});

describe('alcoholPer100g', () => {
  it.each([
    [0, 0],
    [13, 10.257],
    [100, 78.9],
  ])('is %s%% by volume at 0.789 g to the percent', (abv, grams) => {
    // Given what a label states
    const percent = abv;

    // When it is made grams
    const alcohol = alcoholPer100g(percent);

    // Then it is what is kept
    expect(alcohol).toBeCloseTo(grams, 10);
  });

  it.each([-0.1, 100.1, Number.NaN, Number.POSITIVE_INFINITY])('refuses %s%%', (abv) => {
    // Given a percent no drink can be
    const percent = abv;

    // When it is made grams
    const making = () => alcoholPer100g(percent);

    // Then it is refused
    expect(making).toThrow('ABV must be 0 to 100');
  });
});
