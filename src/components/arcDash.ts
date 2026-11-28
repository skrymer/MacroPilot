/**
 * How one of the day ring's arcs is drawn, `width` dp wide at `radius`, to `share` of the way round:
 * its length all the way round, whether its ends are flat, the dash drawn and the angle it starts at.
 */
export function arcDash(share: number, radius: number, width: number) {
  const around = 2 * Math.PI * radius;
  // Round ends that would meet across a small gap read as a fault, so they are flat there; and the
  // flat arc keeps the length its round ends covered, half a width at each, so more never draws less.
  const flat = around * (1 - share) < 2 * width;
  // Short of the whole, half a width stays open, so a ring closes only when its share does.
  const drawn =
    share >= 1
      ? around
      : flat
        ? Math.min(around * share + width, around - width / 2)
        : around * share;
  const start = flat ? -90 - ((width / 2) * 360) / around : -90;
  return { around, flat, drawn, start };
}
