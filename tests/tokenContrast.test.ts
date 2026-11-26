import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

type Palette = Record<string, string>;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tokens: { light: Palette; dark: Palette } = require('../design-tokens');

/** WCAG 2.x relative luminance of a `#RRGGBB` colour. */
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Every text colour the design reference sets, on every ground it sets it on,
 * at the smallest size it is used at. `large` is WCAG's large text — 18pt, or
 * 14pt bold — and earns the lower 3:1 floor; everything else is held to 4.5:1.
 */
const PAIRS: { text: string; on: string; size: 'body' | 'large' }[] = [
  { text: 'ink', on: 'ground', size: 'body' },
  { text: 'ink-mid', on: 'ground', size: 'body' },
  { text: 'ink-dim', on: 'ground', size: 'body' },
  { text: 'ink', on: 'surface', size: 'body' },
  { text: 'ink-mid', on: 'surface', size: 'body' },
  { text: 'ink', on: 'surface-lift', size: 'body' },
  { text: 'ink-dim', on: 'surface', size: 'body' },
  { text: 'ground', on: 'ink', size: 'body' },
  { text: 'within', on: 'surface', size: 'body' },
  { text: 'slightly-over', on: 'surface', size: 'body' },
  { text: 'over', on: 'surface', size: 'body' },
  // A fault is said on a card, and above a form's button on the ground.
  { text: 'fault', on: 'surface', size: 'body' },
  { text: 'fault', on: 'ground', size: 'body' },
  // A field's placeholder, on the field.
  { text: 'ink-mid', on: 'surface-lift', size: 'body' },
  // A tick and a valid field's outline are not text: WCAG's 3:1 for a graphic, the `large` floor.
  { text: 'valid', on: 'surface', size: 'large' },
  // A field's edge at rest, between the card and the field: a control's edge, 3:1 to both.
  { text: 'edge', on: 'surface', size: 'large' },
  { text: 'edge', on: 'surface-lift', size: 'large' },
];

/** Tokens drawn only as a graphic (a tint, an outline), which no `text-` class names. */
const GRAPHICS = ['valid', 'edge'];

const FLOOR = { body: 4.5, large: 3 };

describe('token contrast', () => {
  it('measures contrast the way WCAG does', () => {
    // Given black and white
    const [black, white] = ['#000000', '#FFFFFF'];

    // When their contrast is measured
    const ratio = contrast(black, white);

    // Then it is the maximum WCAG defines
    expect(ratio).toBeCloseTo(21);
  });

  it('keeps a stated absence apart from secondary text', () => {
    // Given the two softer inks of each appearance
    const pairs = [tokens.light, tokens.dark].map((p) => [p['ink-mid']!, p['ink-dim']!] as const);

    // When their contrast with each other is measured
    const ratios = pairs.map(([mid, dim]) => contrast(mid, dim));

    // Then each is at least epic 1's 1.4:1, so `ink-dim` is told from `ink-mid` without its italics
    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(1.4);
  });

  it('defines the same tokens in both appearances', () => {
    // Given the light palette
    const light = Object.keys(tokens.light);

    // When the dark palette's tokens are listed
    const dark = Object.keys(tokens.dark);

    // Then they are the same, so no class goes missing when the system switches
    expect(dark).toEqual(light);
  });

  describe.each([['light'], ['dark']] as const)('in the %s appearance', (appearance) => {
    it.each(PAIRS)('text-$text on bg-$on clears the $size floor', ({ text, on, size }) => {
      // Given a text token on a ground token, as the appearance defines them
      const [foreground, background] = [tokens[appearance][text], tokens[appearance][on]];

      // When their contrast is measured
      const ratio = contrast(foreground!, background!);

      // Then it clears the WCAG floor for that size
      expect(ratio).toBeGreaterThanOrEqual(FLOOR[size]);
    });
  });

  it('covers every text colour the design reference uses', () => {
    // Given the design reference's source, and the shared components it draws through
    const components = path.join(__dirname, '../src/components');
    const source = [
      path.join(__dirname, '../app/design.tsx'),
      ...readdirSync(components, { recursive: true, encoding: 'utf8' })
        .filter((file) => /\.tsx?$/.test(file) && !file.includes('.test.'))
        .map((file) => path.join(components, file)),
    ]
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    // When the text colour classes it sets are collected
    const used = new Set(
      [...source.matchAll(/\btext-([\w-]+)/g)]
        .map((match) => match[1]!)
        .filter((token) => token in tokens.light),
    );

    // Then each one has its contrast checked above
    expect([...used].sort()).toEqual(
      [...new Set(PAIRS.map((p) => p.text))].filter((token) => !GRAPHICS.includes(token)).sort(),
    );
  });
});
