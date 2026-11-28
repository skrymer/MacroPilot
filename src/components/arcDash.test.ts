import { arcDash } from './arcDash';

/** The ring's two arcs, as DayRing draws them: calories outside and thick, protein inside and thin. */
const ARCS = [
  { radius: 110, width: 14 },
  { radius: 88, width: 8 },
];

/** Shares from nothing to the whole, a thousandth apart. */
const SHARES = Array.from({ length: 1001 }, (_, step) => step / 1000);

/** How far round an arc reaches as seen: its dash, and half a width more at each round end. */
const reach = (share: number, radius: number, width: number) => {
  const { flat, drawn } = arcDash(share, radius, width);
  return flat ? drawn : drawn + width;
};

describe('arcDash', () => {
  it.each(ARCS)(
    'never reaches less round as the share rises (radius $radius)',
    ({ radius, width }) => {
      // Given the arc drawn at every share from nothing to the whole

      // When each reach is set beside the one before it
      const fell = SHARES.slice(1).filter(
        (share, step) => reach(share, radius, width) < reach(SHARES[step]!, radius, width) - 1e-9,
      );

      // Then none is shorter than the one before
      expect(fell).toEqual([]);
    },
  );

  it.each(ARCS)(
    'keeps half a width open short of the whole, and closes at it (radius $radius)',
    ({ radius, width }) => {
      // Given the arc's length all the way round
      const { around } = arcDash(1, radius, width);

      // When it is drawn at every share short of the whole, and at the whole
      const closedEarly = SHARES.filter(
        (share) =>
          share > 0 && share < 1 && around - reach(share, radius, width) < width / 2 - 1e-9,
      );

      // Then each short of the whole leaves half a width open, and the whole closes
      expect(closedEarly).toEqual([]);
      expect(arcDash(1, radius, width).drawn).toBe(around);
    },
  );
});
