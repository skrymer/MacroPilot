/**
 * The `maxFontSizeMultiplier` each size in the type scale renders with (ADR
 * 0007). A figure is sized to its place with no headroom, so it never scales;
 * everything else scales to double and stops. Every `fontSize` key in
 * `tailwind.config.js` must appear here: a test holds it.
 */
export const FONT_SCALE_CAPS: Record<string, 1 | 2> = {
  eyebrow: 2,
  label: 2,
  body: 2,
  title: 2,
  figure: 1,
  'figure-lg': 1,
  // Set beside a figure, so it is held with it.
  unit: 1,
};

/** `tailwind.config.js`'s sizes in px, for text the system draws and `Text` cannot cap. */
const SIZES = { title: 22 } as const;

/**
 * A size scaled by the phone's text size and capped as `Text` caps it: for text the system draws
 * from a size it is given, such as the header's title on Android, which does not scale it.
 */
export const scaledBy = (fontScale: number, size: keyof typeof SIZES) =>
  SIZES[size] * Math.min(fontScale, FONT_SCALE_CAPS[size]!);

/** A size of the system's own, such as iOS's 34pt large title, scaled as text that is not a figure. */
export const systemScaledBy = (fontScale: number, pt: number) =>
  pt * Math.min(fontScale, FONT_SCALE_CAPS.title!);
