import { weightForm } from './weightForm';

describe('weightForm', () => {
  it.each([
    ['', 'Enter your weight in kg'],
    ['19.9', 'Enter a weight from 20 to 400 kg'],
    ['400.1', 'Enter a weight from 20 to 400 kg'],
    ['8o', 'Enter a number'],
  ])('refuses "%s": %s', (typed, fault) => {
    // Given what was typed in the field
    const form = { kg: typed };

    // When it is translated
    const translated = weightForm.safeParse(form);

    // Then the field is told its fault, and a blank is never a 0
    expect(translated.error?.issues.map(({ message }) => message)).toEqual([fault]);
  });

  it('reads a decimal comma as a point', () => {
    // Given a weight typed with a comma
    const form = { kg: '82,4' };

    // When it is translated
    const translated = weightForm.safeParse(form);

    // Then it is 82.4 kg
    expect(translated.data).toEqual({ kg: 82.4 });
  });
});
