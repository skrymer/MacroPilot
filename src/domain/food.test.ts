import { caloriesPer100g, inNameOrder, newFood } from './food';

describe('caloriesPer100g', () => {
  it('is 4 per gram of protein and of carbohydrate, and 9 of fat', () => {
    // Given a food's macros per 100 g
    const macros = { protein: 10, carbohydrate: 20, fat: 5 };

    // When its calories are worked out
    const calories = caloriesPer100g(macros);

    // Then each macro has given its own
    expect(calories).toBe(40 + 80 + 45);
  });
});

describe('inNameOrder', () => {
  it('puts foods in order of name, whatever their case and the spaces around them', () => {
    // Given foods in no order, named in both cases, one of them twice
    const macros = { protein: 10, carbohydrate: 20, fat: 5 };
    const foods = [
      { id: 1, name: ' oats', macros },
      { id: 2, name: 'Éclair', macros },
      { id: 3, name: 'MILK', macros },
      { id: 4, name: ' yam', macros },
      { id: 5, name: 'Zucchini', macros },
      { id: 6, name: 'Milk', macros },
      { id: 7, name: 'banana', macros },
    ];

    // When they are put in order
    const ordered = inNameOrder(foods);

    // Then they read down as a dictionary does, and two of one name by which came first
    expect(ordered.map(({ id }) => id)).toEqual([7, 2, 3, 6, 1, 4, 5]);
  });
});

describe('newFood', () => {
  it.each([
    ['empty', ''],
    ['of spaces', '   '],
    ['of other white space', '\t\n '],
  ])('refuses a name that is %s', (_, name) => {
    // Given macros a food could have, and a name that says nothing
    const macros = { protein: 10, carbohydrate: 20, fat: 5 };

    // When a food is made of them
    const making = () => newFood({ name, macros });

    // Then it is refused, naming the fault
    expect(making).toThrow('A food needs a name');
  });

  it.each([
    ['negative', -0.1],
    ['not a number', Number.NaN],
    ['not finite', Number.POSITIVE_INFINITY],
  ])('refuses any macro that is %s', (_, figure) => {
    // Given a food with one macro wrong, each in turn
    const right = { protein: 10, carbohydrate: 20, fat: 5 };
    const wrong = (['protein', 'carbohydrate', 'fat'] as const).map((macro) => ({
      macro,
      macros: { ...right, [macro]: figure },
    }));

    // When a food is made of each
    const makings = wrong.map(({ macro, macros }) => ({
      macro,
      making: () => newFood({ name: 'Oats', macros }),
    }));

    // Then each is refused, naming the macro
    for (const { macro, making } of makings) expect(making).toThrow(`${macro} must be 0 or more`);
  });

  it('keeps the name as typed, and a macro of 0', () => {
    // Given a food typed with spaces around its name, and no macro in it
    const typed = { name: ' black COFFEE ', macros: { protein: 0, carbohydrate: 0, fat: 0 } };

    // When the food is made
    const food = newFood(typed);

    // Then it is as it was typed
    expect(food).toEqual({
      name: ' black COFFEE ',
      macros: { protein: 0, carbohydrate: 0, fat: 0 },
    });
  });
});
