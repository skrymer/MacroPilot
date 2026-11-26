import { caloriesPer100g, inNameOrder, newFood, type Macros } from './food';

describe('caloriesPer100g', () => {
  it('is 4 per gram of protein and of carbohydrate, and 9 of fat', () => {
    // Given a food's macros per 100 g
    const macros = { protein: 10, carbohydrate: 20, fat: 5 };

    // When its calories are worked out
    const calories = caloriesPer100g(macros);

    // Then each macro has given its own
    expect(calories).toBe(40 + 80 + 45);
  });

  it('is 2 per gram of fibre, and 7 of alcohol, where they are stated', () => {
    // Given a food that states both
    const macros = { protein: 0, carbohydrate: 12.8, fat: 0, fibre: 16.8, alcohol: 10 };

    // When its calories are worked out
    const calories = caloriesPer100g(macros);

    // Then each has given its own
    expect(calories).toBeCloseTo(51.2 + 33.6 + 70, 10);
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
    ['of other white space', '\t\n\u00a0'],
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
    const named = ['protein', 'carbohydrate', 'fat', 'fibre', 'alcohol'] as const;
    const wrong = named.map((macro) => ({ macro, macros: { ...right, [macro]: figure } }));

    // When a food is made of each
    const makings = wrong.map(({ macro, macros }) => ({
      macro,
      making: () => newFood({ name: 'Oats', macros }),
    }));

    // Then each is refused, naming the macro
    for (const { macro, making } of makings) expect(making).toThrow(`${macro} must be 0 or more`);
  });

  it.each(['protein', 'carbohydrate', 'fat'])('refuses %s not stated', (macro) => {
    // Given macros without one that a food always states
    const macros = { protein: 10, carbohydrate: 20, fat: 5, [macro]: undefined } as Macros;

    // When a food is made of them
    const making = () => newFood({ name: 'Oats', macros });

    // Then it is refused, naming the macro
    expect(making).toThrow(`${macro} must be 0 or more`);
  });

  it('takes fibre and alcohol not stated, and adds nothing for them', () => {
    // Given a food that states neither
    const macros = { protein: 10, carbohydrate: 20, fat: 5, fibre: undefined, alcohol: undefined };

    // When it is made
    const food = newFood({ name: 'Oats', macros });

    // Then they are still not stated, and its calories are the others'
    expect(food.macros.fibre).toBeUndefined();
    expect(food.macros.alcohol).toBeUndefined();
    expect(caloriesPer100g(food.macros)).toBe(165);
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
