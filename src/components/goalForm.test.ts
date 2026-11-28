import { goalForm } from './goalForm';

/** Today's figures the form judges against: a trend of 82.4 kg and a maintenance of 2534.35 kcal. */
const NOW = { trendKg: 82.4, maintenanceKcal: 2534.35 };

/** What the form says of `form`, field by field. */
const faults = (form: { targetKg: string; rateKgPerWeek: string }) =>
  Object.fromEntries(
    (goalForm(NOW).safeParse(form).error?.issues ?? []).map(({ path, message }) => [
      path.join('.'),
      message,
    ]),
  );

describe('goalForm', () => {
  it('asks for a target and a rate left blank, never taking a blank as 0', () => {
    // Given both fields left blank
    const form = { targetKg: '', rateKgPerWeek: '' };

    // When it is translated
    const said = faults(form);

    // Then each field says what it needs
    expect(said).toEqual({
      targetKg: 'Enter a target weight',
      rateKgPerWeek: 'Enter a weekly rate',
    });
  });

  it.each(['82.4', '90', '0', '-1'])(
    'refuses a target of "%s", not above 0 and below the trend',
    (typed) => {
      // Given a target typed that is not below the trend or not above 0, and a rate that is fine
      const form = { targetKg: typed, rateKgPerWeek: '0.5' };

      // When it is translated
      const said = faults(form);

      // Then the target is told why, with the trend it must be below
      expect(said).toEqual({
        targetKg: 'A weight-loss goal needs a target below your current trend weight (82.4 kg)',
      });
    },
  );

  it.each([
    ['0.04', 'Rate must be at least 0.05 kg a week'],
    ['1.51', 'Rate must be at most 1.5 kg a week'],
  ])('refuses a rate of "%s": %s', (typed, fault) => {
    // Given a rate typed just outside its limits, and a target that is fine
    const form = { targetKg: '75', rateKgPerWeek: typed };

    // When it is translated
    const said = faults(form);

    // Then the rate is told its limit
    expect(said).toEqual({ rateKgPerWeek: fault });
  });

  it.each(['0.05', '1.5'])('takes a rate of "%s", at its limit', (typed) => {
    // Given a rate typed at one of its limits, and a target that is fine
    const form = { targetKg: '75', rateKgPerWeek: typed };

    // When it is translated
    const translated = goalForm(NOW).safeParse(form);

    // Then it is taken as typed
    expect(translated.data).toEqual({ targetKg: 75, rateKgPerWeek: Number(typed) });
  });

  it('refuses a rate whose deficit would reach maintenance, saying both', () => {
    // Given a maintenance of 1650 kcal a day, and 1.5 kg a week typed (1650 kcal a day)
    const form = { targetKg: '75', rateKgPerWeek: '1,5' };

    // When it is translated
    const translated = goalForm({ trendKg: 82.4, maintenanceKcal: 1650 }).safeParse(form);

    // Then the rate is told it would leave nothing to eat
    expect(translated.error?.issues.map(({ message }) => message)).toEqual([
      'At your current maintenance of 1650 kcal a day, 1.5 kg a week would leave you nothing to eat — choose a slower rate',
    ]);
  });
});
