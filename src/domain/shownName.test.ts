import { shownName } from './shownName';

describe('shownName', () => {
  it.each([
    ['rolled oats', 'Rolled oats'],
    ['Free Range Eggs', 'Free range eggs'],
    ['Big Oat milk', 'Big oat milk'],
    ['LIGHT MILK', 'Light milk'],
    ['Bulla cottage cheese', 'Bulla cottage cheese'],
    ['Coles SMOOTH PEANUT butter', 'Coles smooth peanut butter'],
    ['CRÈME FRAÎCHE', 'Crème fraîche'],
  ])('puts %s in sentence case', (typed, shown) => {
    // Given a name as it was typed
    const name = typed;

    // When it is shown
    const stated = shownName(name);

    // Then it reads as a sentence does
    expect(stated).toBe(shown);
  });

  it.each([
    ['UHT milk', 'UHT milk'],
    ['skim milk (UHT)', 'Skim milk (UHT)'],
    ['BCAA powder', 'Bcaa powder'],
    ['UHT MILK', 'Uht milk'],
    ['LOW FAT MILK', 'Low fat milk'],
    ['oats & MSG', 'Oats & MSG'],
  ])('keeps an initialism of up to three letters beside lower case: %s', (typed, shown) => {
    // Given a name that may have an initialism in it
    const name = typed;

    // When it is shown
    const stated = shownName(name);

    // Then an initialism stands only where the rest of the name is not shouted too
    expect(stated).toBe(shown);
  });

  it.each([
    ['  light milk', 'Light milk'],
    ['"greek" yoghurt', '"Greek" yoghurt'],
    ['(organic) oats', '(Organic) oats'],
    ['500g rolled oats', '500g rolled oats'],
    ['2% milk', '2% milk'],
    ['2 large eggs', '2 large eggs'],
  ])(
    'capitalises the first letter where no letter or digit comes before it: %s',
    (typed, shown) => {
      // Given a name that does not begin with a letter
      const name = typed;

      // When it is shown
      const stated = shownName(name);

      // Then its first letter is a capital unless a figure opens the name
      expect(stated).toBe(shown);
    },
  );

  it.each([
    ['Bulla A2 MILK', 'Bulla A2 milk'],
    ['b12 SUPPLEMENT', 'B12 supplement'],
    ['A2 MILK', 'A2 milk'],
  ])('leaves a word with a digit in it alone: %s', (typed, shown) => {
    // Given a name with such a word
    const name = typed;

    // When it is shown
    const stated = shownName(name);

    // Then that word is as it was typed, but for a first letter capitalised
    expect(stated).toBe(shown);
  });
});
