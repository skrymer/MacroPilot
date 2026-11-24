const plugin = require('tailwindcss/plugin');
const tokens = require('./design-tokens');

/** `#RRGGBB` as the channels `rgb(… / <alpha-value>)` takes, so `bg-ground/50` works. */
const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');

const variables = (palette) =>
  Object.fromEntries(
    Object.entries(palette).map(([name, hex]) => [`--color-${name}`, channels(hex)]),
  );

/**
 * The type scale and the touch target, with the colours from `design-tokens.js`. DESIGN.md is the
 * prose and `app/design.tsx` the live reference. No hex value belongs in a component: a missing
 * token is added to DESIGN.md first, then to the tokens.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Every size here needs a cap in `src/components/fontScaleCaps.ts` (ADR 0007).
      fontSize: {
        eyebrow: ['11px', { lineHeight: '17px' }],
        label: ['13px', { lineHeight: '20px' }],
        body: ['16px', { lineHeight: '24px' }],
        title: ['22px', { lineHeight: '36px' }],
        figure: ['44px', { lineHeight: '54px' }],
        'figure-lg': ['72px', { lineHeight: '88px' }],
        // Beside a figure: `title`'s size, held fixed like the figure it belongs to.
        unit: ['22px', { lineHeight: '36px' }],
      },
      // React Native picks a face by family name, not by weight, so each face is its own token. A
      // weighed figure is set solid and an estimated one lighter; B612's digits are tabular.
      fontFamily: {
        language: ['B612_400Regular'],
        'language-bold': ['B612_700Bold'],
        weighed: ['B612_700Bold'],
        estimated: ['B612_400Regular'],
        absence: ['B612_400Regular_Italic'],
      },
      // The 44pt touch target, in px on purpose. The numeric scale is rem-based and NativeWind's
      // native rem is 14, so `h-11` is 38.5pt on an iPhone. `a11y/touch-target` requires both
      // floors on every Pressable.
      minHeight: { target: '44px' },
      // `name` is the least a name keeps beside its figure: the longest word of one, at double. With
      // less, the figure drops below it. A basis does not do this: Yoga shrinks past it.
      minWidth: { target: '44px', name: '150px' },
      colors: Object.fromEntries(
        Object.keys(tokens.light).map((name) => [
          name,
          `rgb(var(--color-${name}) / <alpha-value>)`,
        ]),
      ),
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': variables(tokens.light),
        '@media (prefers-color-scheme: dark)': { ':root': variables(tokens.dark) },
      });
    }),
  ],
};
