import { detailsForm } from './detailsForm';

const TODAY = '2026-11-27';
const GIVEN = { sex: 'male', born: '1984-03-14', heightCm: '181', countsCalories: true };

describe('detailsForm', () => {
  it.each([
    ['born', '', 'Enter your birth date'],
    ['born', '2026-11-27', 'Birth date must be in the past'],
    ['born', '1906-11-26', 'Birth date must be within the last 120 years'],
    ['heightCm', '', 'Enter your height in cm'],
    ['heightCm', '0', 'Height must be greater than 0'],
    ['heightCm', '300', 'Height must be less than 300'],
    ['heightCm', '1.5.0', 'Enter a number'],
    ['sex', undefined, 'Choose your sex'],
  ])('refuses a %s of "%s": %s', (field, typed, fault) => {
    // Given details with one field given so
    const form = { ...GIVEN, [field]: typed };

    // When they are translated on 27 November 2026
    const translated = detailsForm(TODAY).safeParse(form);

    // Then that field is told its fault, in the reference app's words
    expect(translated.error?.issues.map(({ message }) => message)).toEqual([fault]);
  });
});
