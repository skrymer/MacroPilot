import { dayWords } from './dayWords';

describe('dayWords', () => {
  it.each([
    ['2026-11-24', 'Tue 24 Nov'],
    ['2026-01-05', 'Mon 5 Jan'],
    ['2026-09-08', 'Tue 8 Sept'],
    ['2028-02-29', 'Tue 29 Feb'],
    ['2026-12-31', 'Thu 31 Dec'],
    ['2027-08-01', 'Sun 1 Aug'],
    ['2026-11-25', 'Wed 25 Nov'],
    ['2026-11-27', 'Fri 27 Nov'],
    ['2026-11-28', 'Sat 28 Nov'],
  ])('says %s as %s, whatever the phone’s language and zone', (day, words) => {
    // Given a day as it is kept
    const kept = day;

    // When it is put in words
    const said = dayWords(kept);

    // Then it has its weekday, and no year
    expect(said).toBe(words);
  });
});
