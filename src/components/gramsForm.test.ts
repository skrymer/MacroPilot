import { gramsForm } from './gramsForm';

describe('gramsForm', () => {
  it.each([
    ['', 'Enter the weight in grams'],
    ['  ', 'Enter the weight in grams'],
    ['0', 'Grams must be greater than 0'],
    ['-5', 'Grams must be greater than 0'],
    ['1,500', 'Did you mean 1500 or 1.5?'],
    ['abc', 'Enter a number'],
  ])('refuses "%s": %s', (typed, fault) => {
    // Given what was typed in the field
    const form = { grams: typed };

    // When it is translated
    const translated = gramsForm.safeParse(form);

    // Then the field is told its fault, and a blank is never a 0
    expect(translated.error?.issues.map(({ message }) => message)).toEqual([fault]);
  });
});
