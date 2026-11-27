import { ageOn, isBirthDate, isHeight, newProfile } from './profile';

const PROFILE = { sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true } as const;

describe('newProfile', () => {
  it('gives back a profile that is one, as it was given', () => {
    // Given a profile within every limit

    // When it is made on 27 November 2026
    const made = newProfile(PROFILE, '2026-11-27');

    // Then it is the same
    expect(made).toEqual(PROFILE);
  });

  it('refuses a height that is not one', () => {
    // Given a profile 300 cm tall

    // When it is made on 27 November 2026
    const making = () => newProfile({ ...PROFILE, heightCm: 300 }, '2026-11-27');

    // Then it is refused
    expect(making).toThrow('A height is above 0 and below 300 cm');
  });

  it('refuses a birth date that is not one on the day it is given', () => {
    // Given a profile born today

    // When it is made today
    const making = () => newProfile({ ...PROFILE, born: '2026-11-27' }, '2026-11-27');

    // Then it is refused
    expect(making).toThrow('A birth date is before today and at most 120 years ago');
  });
});

describe('isHeight', () => {
  it('refuses 300 cm, which is a slip of the decimal point', () => {
    // Given nothing

    // When 300 cm is given as a height
    const refused = isHeight(300);

    // Then it is not one
    expect(refused).toBe(false);
  });

  it('refuses 0 cm', () => {
    // Given nothing

    // When 0 cm is given as a height
    const refused = isHeight(0);

    // Then it is not one
    expect(refused).toBe(false);
  });

  it('takes a height just inside each end', () => {
    // Given nothing

    // When 0.1 cm and 299.9 cm are given
    const ends = [isHeight(0.1), isHeight(299.9)];

    // Then both are heights
    expect(ends).toEqual([true, true]);
  });
});

describe('isBirthDate', () => {
  it('refuses today, since nobody is born on the day they say so', () => {
    // Given today, 27 November 2026

    // When today is given as a birth date
    const refused = isBirthDate('2026-11-27', '2026-11-27');

    // Then it is not one
    expect(refused).toBe(false);
  });

  it('refuses a date more than 120 years ago, which is a slip and not a life', () => {
    // Given today, 27 November 2026

    // When a birth date 120 years and a day ago is given
    const refused = isBirthDate('1906-11-26', '2026-11-27');

    // Then it is not one
    expect(refused).toBe(false);
  });

  it('takes yesterday, and a date 120 years ago to the day', () => {
    // Given today, 27 November 2026

    // When each end of a life is given
    const ends = [isBirthDate('2026-11-26', '2026-11-27'), isBirthDate('1906-11-27', '2026-11-27')];

    // Then both are birth dates
    expect(ends).toEqual([true, true]);
  });
});

describe('ageOn', () => {
  it('does not count a birthday not yet reached', () => {
    // Given someone born on 14 March 1984

    // When their age is asked the day before their 42nd birthday
    const age = ageOn('1984-03-14', '2026-03-13');

    // Then they are 41
    expect(age).toBe(41);
  });

  it('counts a birthday on the day itself, and after it', () => {
    // Given someone born on 14 March 1984

    // When their age is asked on their 42nd birthday and in June
    const ages = [ageOn('1984-03-14', '2026-03-14'), ageOn('1984-03-14', '2026-06-01')];

    // Then they are 42 on both (Stryker: `<` to `<=`, and the month and day compared whole)
    expect(ages).toEqual([42, 42]);
  });
});
