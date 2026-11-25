const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sept Oct Nov Dec'.split(' ');

/** A day as it is kept, `2026-11-24`, in words: its own date, whatever zone the phone is in. */
export function dayWords(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}
