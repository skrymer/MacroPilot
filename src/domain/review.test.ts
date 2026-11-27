import { newReview, reviewDue, reviewFor } from './review';

describe('reviewDue', () => {
  it('runs nothing before Setup, and the first review once both are there', () => {
    // Given a profile, a weigh-in, and no review yet
    const profile = PROFILE;
    const weighIns = [{ day: '2026-11-28', kg: 82 }];

    // When it is asked whether a review is due, with each missing, and with both
    const due = [
      reviewDue({ profile: undefined, weighIns, reviews: [], today: '2026-11-28' }),
      reviewDue({ profile, weighIns: [], reviews: [], today: '2026-11-28' }),
      reviewDue({ profile, weighIns, reviews: [], today: '2026-11-28' })?.day,
    ];

    // Then only the last runs one, dated today
    expect(due).toEqual([undefined, undefined, '2026-11-28']);
  });

  it('runs today’s again when today’s weigh-in is replaced, and nothing else once one exists', () => {
    // Given yesterday's review, and today's weigh-in fixed from 820 kg to 82 kg
    const reviews = [{ ...REVIEW, day: '2026-11-27' }];
    const weighIns = [{ day: '2026-11-28', kg: 82 }];

    // When it is asked whether a review is due, after the replace and after anything else
    const replaced = reviewDue({
      profile: PROFILE,
      weighIns,
      reviews,
      today: '2026-11-28',
      replacedToday: true,
    });
    const otherwise = reviewDue({ profile: PROFILE, weighIns, reviews, today: '2026-11-28' });

    // Then the replace runs today's, set from the weight as fixed
    expect(replaced?.day).toBe('2026-11-28');
    expect(replaced?.trendKg).toBe(82);
    expect(otherwise).toBeUndefined();
  });
});

const REVIEW = { trendKg: 82, maintenanceKcal: 2400, budgetKcal: 2400, proteinFloorG: 164 };

describe('reviewFor', () => {
  it('holds a day to the latest review on or before it, and none before the first', () => {
    // Given reviews on the 20th and the 27th
    const reviews = [
      { ...REVIEW, day: '2026-11-20' },
      { ...REVIEW, day: '2026-11-27', budgetKcal: 2300 },
    ];

    // When the 19th, the 20th, the 26th and the 28th ask for theirs
    const held = ['2026-11-19', '2026-11-20', '2026-11-26', '2026-11-28'].map(
      (day) => reviewFor(reviews, day)?.day,
    );

    // Then each has the latest on or before it, and the 19th none
    expect(held).toEqual([undefined, '2026-11-20', '2026-11-20', '2026-11-27']);
  });
});

const PROFILE = { sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true } as const;

describe('newReview', () => {
  it('sets the budget at the seeded maintenance and the floor at 2 g a kilo of trend, unrounded', () => {
    // Given a man of 181 cm, 42, with weigh-ins of 82 kg and 80 kg a day apart (a trend of 81.8 kg)
    const weighIns = [
      { day: '2026-11-27', kg: 82 },
      { day: '2026-11-28', kg: 80 },
    ];

    // When the review is run on 28 November 2026
    const review = newReview(PROFILE, weighIns, '2026-11-28');

    // Then it is dated that day, from the trend, with no Goal's deficit
    const maintenance = (818 + 1131.25 - 210 + 5) * 1.4;
    expect(review.day).toBe('2026-11-28');
    expect(review.trendKg).toBeCloseTo(81.8, 10);
    expect(review.maintenanceKcal).toBeCloseTo(maintenance, 10);
    expect(review.budgetKcal).toBeCloseTo(maintenance, 10);
    expect(review.proteinFloorG).toBeCloseTo(163.6, 10);
  });
});
