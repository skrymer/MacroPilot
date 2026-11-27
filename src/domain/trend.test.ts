import { trendWeight } from './trend';

describe('trendWeight', () => {
  it('has none before the first weigh-in, never 0 kg', () => {
    // Given no weigh-ins

    // When the trend is taken
    const trend = trendWeight([]);

    // Then there is none
    expect(trend).toBeUndefined();
  });

  it('is the first weigh-in when there is only one', () => {
    // Given one weigh-in of 82.4 kg

    // When the trend is taken
    const trend = trendWeight([{ day: '2026-11-27', kg: 82.4 }]);

    // Then it is that weight
    expect(trend).toBe(82.4);
  });

  it('moves a tenth of the way to a weigh-in a day later', () => {
    // Given 82 kg, and 80 kg the next day

    // When the trend is taken
    const trend = trendWeight([
      { day: '2026-11-27', kg: 82 },
      { day: '2026-11-28', kg: 80 },
    ]);

    // Then it is 81.8 kg
    expect(trend).toBeCloseTo(81.8, 10);
  });

  it('moves further for a weigh-in after days without one, compounding, filling nothing in', () => {
    // Given 82 kg, and 80 kg three days later

    // When the trend is taken
    const trend = trendWeight([
      { day: '2026-11-25', kg: 82 },
      { day: '2026-11-28', kg: 80 },
    ]);

    // Then it keeps 0.9³ of 82 and takes the rest from 80: 81.458 kg
    expect(trend).toBeCloseTo(0.729 * 82 + 0.271 * 80, 10);
  });
});
