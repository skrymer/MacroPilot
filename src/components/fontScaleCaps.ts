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
