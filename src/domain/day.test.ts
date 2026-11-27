import { dayOf, daysBetween, yearsBefore } from './day';

describe('daysBetween', () => {
  it('counts the whole days from one date to a later one, across a leap day', () => {
    // Given 27 February 2028, two days before a leap day

    // When the days to 1 March 2028 are counted
    const days = daysBetween('2028-02-27', '2028-03-01');

    // Then there are 3, the 29th among them
    expect(days).toBe(3);
  });
});

describe('yearsBefore', () => {
  it('takes a leap day back to the last of February in a year that has none', () => {
    // Given 29 February 2028

    // When thirty years before it is asked
    const day = yearsBefore('2028-02-29', 30);

    // Then it is 28 February 1998, a day that exists
    expect(day).toBe('1998-02-28');
  });

  it('keeps a leap day in a year that has one', () => {
    // Given 29 February 2028

    // When 120 years before it is asked
    const day = yearsBefore('2028-02-29', 120);

    // Then it is 29 February 1908, a leap year (Stryker: the leap year taken for none)
    expect(day).toBe('1908-02-29');
  });
});

describe('dayOf', () => {
  it.each([
    ['UTC', 0, Date.UTC(2026, 10, 24, 23, 59, 59), '2026-11-24'],
    ['UTC, a second on', 0, Date.UTC(2026, 10, 25, 0, 0, 0), '2026-11-25'],
    ['ten hours ahead', 600, Date.UTC(2026, 10, 24, 13, 59, 59), '2026-11-24'],
    ['ten hours ahead, a second on', 600, Date.UTC(2026, 10, 24, 14, 0, 0), '2026-11-25'],
    ['five and a half hours ahead', 330, Date.UTC(2026, 10, 24, 18, 30, 0), '2026-11-25'],
    ['eight hours behind', -480, Date.UTC(2026, 11, 1, 7, 59, 59), '2026-11-30'],
    ['eight hours behind, over a new year', -480, Date.UTC(2027, 0, 1, 7, 0, 0), '2026-12-31'],
  ])('is the phone’s own date: %s', (_, offsetMinutes, now, day) => {
    // Given a moment, on a phone so far from UTC
    const moment = now;

    // When its day is decided
    const decided = dayOf(moment, offsetMinutes);

    // Then it is the date the phone shows
    expect(decided).toBe(day);
  });
});
