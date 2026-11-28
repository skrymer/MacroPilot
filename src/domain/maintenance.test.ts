import { seedMaintenance } from './maintenance';

const PROFILE = { sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true } as const;

describe('seedMaintenance', () => {
  it('is a man’s basal rate by Mifflin-St Jeor on the trend and his age that day, times 1.4', () => {
    // Given a man of 181 cm, 42 on 28 November 2026, with a trend of 82 kg

    // When his first maintenance is seeded that day
    const kcal = seedMaintenance(PROFILE, 82, '2026-11-28');

    // Then it is (10 × 82 + 6.25 × 181 − 5 × 42 + 5) × 1.4
    expect(kcal).toBeCloseTo((820 + 1131.25 - 210 + 5) * 1.4, 10);
  });

  it('takes 161 off a woman’s basal rate where a man’s has 5 added', () => {
    // Given a woman of 168.5 cm, 40 the day before her 41st birthday, with a trend of 64.2 kg

    // When her first maintenance is seeded
    const kcal = seedMaintenance(
      { ...PROFILE, sex: 'female', heightCm: 168.5, born: '1985-11-29' },
      64.2,
      '2026-11-28',
    );

    // Then it is (10 × 64.2 + 6.25 × 168.5 − 5 × 40 − 161) × 1.4
    expect(kcal).toBeCloseTo((642 + 1053.125 - 200 - 161) * 1.4, 10);
  });
});
