import { foodForm } from './foodForm';

/** What each field is told, by its name. */
const faults = (typed: Record<string, string>) =>
  Object.fromEntries(
    foodForm.safeParse(typed).error?.issues.map(({ path, message }) => [path[0], message]) ?? [],
  );

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
    const typed = { name: ' OATS ', protein: '13,2', carbohydrate: '56.1', fat: '0' };

    // When it is translated
    const translated = foodForm.safeParse(typed);

    // Then the figures are as typed
    expect(translated.data).toEqual({ name: ' OATS ', protein: 13.2, carbohydrate: 56.1, fat: 0 });
  });
});
