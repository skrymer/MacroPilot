/**
 * Every colour in the app, once per appearance. `tailwind.config.js` turns each token into a CSS
 * variable that the system's appearance switches, so a class such as `bg-ground` is right in both
 * and no component writes `dark:`. `tests/tokenContrast.test.ts` holds both appearances to WCAG.
 *
 * The values are neutral placeholders until the design system is decided (DESIGN.md).
 */
module.exports = {
  light: {
    ground: '#FFFFFF',
    surface: '#F4F4F4',
    'surface-lift': '#E9E9E9',
    line: '#D4D4D4',
    'ink-dim': '#666666',
    'ink-mid': '#4A4A4A',
    ink: '#171717',
  },
  dark: {
    ground: '#121212',
    surface: '#1C1C1C',
    'surface-lift': '#282828',
    line: '#383838',
    'ink-dim': '#919191',
    'ink-mid': '#B8B8B8',
    ink: '#F2F2F2',
  },
};
