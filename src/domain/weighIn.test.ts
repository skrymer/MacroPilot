import { isWeight, newWeighIn } from './weighIn';

describe('newWeighIn', () => {
  it('refuses a weigh-in for a day after today', () => {
    // Given today, 28 November 2026

    // When a weigh-in for tomorrow is made
    const making = () => newWeighIn({ day: '2026-11-29', kg: 82 }, '2026-11-28');

    // Then it is refused
    expect(making).toThrow('A weigh-in is for today or a day before it');
  });

  it('refuses a weight that is not one', () => {
    // Given today, 28 November 2026

    // When a weigh-in of 820 kg is made for today
    const making = () => newWeighIn({ day: '2026-11-28', kg: 820 }, '2026-11-28');

    // Then it is refused
    expect(making).toThrow('A weight is from 20 to 400 kg');
  });
});

describe('isWeight', () => {
  it('refuses a weight under 20 kg', () => {
    // Given nothing

    // When 19.9 kg is given
    const refused = isWeight(19.9);

    // Then it is not a weight
    expect(refused).toBe(false);
  });

  it('refuses a weight over 400 kg', () => {
    // Given nothing

    // When 400.1 kg is given
    const refused = isWeight(400.1);

    // Then it is not a weight
    expect(refused).toBe(false);
  });
});
