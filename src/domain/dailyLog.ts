type Figures = { calories: number; protein: number };

/** What a day's entries add up to, unrounded. A day with none has 0 of each, which is known. */
export function totalsOf(entries: readonly Figures[]): Figures {
  const sum = (figure: keyof Figures) => entries.reduce((total, entry) => total + entry[figure], 0);
  return { calories: sum('calories'), protein: sum('protein') };
}
