import { foodForm, foodOf } from './foodForm';

/** What each field is told, by its name. */
const faults = (typed: Record<string, string>) =>
  Object.fromEntries(
    foodForm
      .safeParse({ fibre: '', abv: '', ...typed })
      .error?.issues.map(({ path, message }) => [path[0], message]) ?? [],
  );

describe('foodOf', () => {
  it.each([
    ['not stated', undefined, undefined, undefined],
    ['none', 0, 0, 0],
    ['some, its percent made grams', 16.8, 13, 10.257],
  ])('makes a food of a form whose fibre and alcohol are %s', (_, fibre, abv, alcohol) => {
    // Given what a form said
    const said = { name: 'Oats', protein: 1, carbohydrate: 2, fat: 3, fibre, abv };

    // When a food is made of it
    const food = foodOf(said);

    // Then each figure is in its own place, and nothing else with them
    expect(food).toStrictEqual({
      name: 'Oats',
      macros: { protein: 1, carbohydrate: 2, fat: 3, fibre, alcohol },
    });
  });
});

describe('foodForm', () => {
  it('asks for each of the figures and the name, when all are blank', () => {
    // Given a form as it opens
    const typed = { name: '', protein: '', carbohydrate: '', fat: '' };

    // When it is translated
    const told = faults(typed);

    // Then each field is asked for by name, a blank figure never taken as 0
    expect(told).toEqual({
      name: 'Enter a name',
      protein: 'Enter protein per 100 g',
      carbohydrate: 'Enter carbohydrate per 100 g',
      fat: 'Enter fat per 100 g',
    });
  });

  it('says which of fibre and alcohol is negative, and that alcohol is over 100', () => {
    // Given the optional figures out of their range, a form each
    const oats = { name: 'Oats', protein: '1', carbohydrate: '2', fat: '3', fibre: '', abv: '' };

    // When each is translated
    const told = [
      faults({ ...oats, fibre: '-0.1', abv: '-1' }),
      faults({ ...oats, abv: '100.1' }),
      faults({ ...oats, fibre: '0', abv: '100' }),
    ];

    // Then each field is told its own fault, and 0 and 100 have none
    expect(told).toEqual([
      { fibre: 'Fibre can’t be negative', abv: 'Alcohol can’t be negative' },
      { abv: 'Alcohol can’t be over 100%' },
      {},
    ]);
  });

  it('refuses a name of spaces, and says which macro is negative', () => {
    // Given a name that says nothing, and each macro below zero
    const typed = { name: '  ', protein: '-1', carbohydrate: '-0,1', fat: '-20' };

    // When it is translated
    const told = faults(typed);

    // Then each field is told its own fault
    expect(told).toEqual({
      name: 'Enter a name',
      protein: 'Protein can’t be negative',
      carbohydrate: 'Carbohydrate can’t be negative',
      fat: 'Fat can’t be negative',
    });
  });

  it('gives each figure in its own place, a 0 kept and the name as typed', () => {
    // Given a form filled with a comma, a point and a zero
    const macros = { protein: '13,2', carbohydrate: '56.1', fat: '0', fibre: '', abv: '' };
    const typed = { name: ' OATS ', ...macros };

    // When it is translated
    const translated = foodForm.safeParse(typed);

    // Then the figures are as typed
    expect(translated.data).toEqual({ name: ' OATS ', protein: 13.2, carbohydrate: 56.1, fat: 0 });
  });
});
