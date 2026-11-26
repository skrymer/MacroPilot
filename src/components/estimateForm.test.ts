import { estimateForm } from './estimateForm';

const LUNCH = { label: 'pub lunch', calories: '850', protein: '' };

/** What each field is told, by its name. */
const faults = (typed: Partial<typeof LUNCH>) =>
  Object.fromEntries(
    estimateForm
      .safeParse({ ...LUNCH, ...typed })
      .error?.issues.map(({ path, message }) => [path[0], message]) ?? [],
  );

describe('estimateForm', () => {
  it.each([
    ['protein left blank', {}, { label: 'pub lunch', calories: 850, protein: undefined }],
    ['protein none', { protein: '0' }, { label: 'pub lunch', calories: 850, protein: 0 }],
    [
      'the fewest calories',
      { calories: '1' },
      { label: 'pub lunch', calories: 1, protein: undefined },
    ],
    ['a comma', { protein: '30,5' }, { label: 'pub lunch', calories: 850, protein: 30.5 }],
  ])('says an estimate with %s', (_, typed, estimate) => {
    // Given what was typed in the fields
    const form = { ...LUNCH, ...typed };

    // When it is translated
    const translated = estimateForm.safeParse(form);

    // Then it is what was typed, a blank never a 0 nor a 0 a blank
    expect(translated.data).toStrictEqual(estimate);
  });

  it.each([
    ['', { label: 'Enter a label for this entry' }],
    ['  ', { label: 'Enter a label for this entry' }],
  ])('refuses "%s" as a label', (label, told) => {
    // Given a label of nothing
    const typed = { label };

    // When it is translated
    const said = faults(typed);

    // Then the field is told, and no other
    expect(said).toEqual(told);
  });

  it.each([
    [{ calories: '' }, { calories: 'Enter an estimated calorie figure' }],
    [{ calories: '-1' }, { calories: 'Calories can’t be negative' }],
    [{ calories: '1,500' }, { calories: 'Did you mean 1500 or 1.5?' }],
    [{ calories: '0,9' }, { calories: 'Calories must be at least 1' }],
    [{ protein: '-0.1' }, { protein: 'Protein can’t be negative' }],
    [{ protein: 'x' }, { protein: 'Enter a number' }],
  ])('refuses %j', (typed, told) => {
    // Given a figure that is none, or cannot be
    const form = typed;

    // When it is translated
    const said = faults(form);

    // Then its field is told, and no other
    expect(said).toEqual(told);
  });
});
