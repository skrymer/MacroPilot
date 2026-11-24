import { dayOf } from './day';

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
