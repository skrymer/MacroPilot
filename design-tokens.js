/**
 * Every colour in the app, once per appearance. `tailwind.config.js` turns each token into a CSS
 * variable that the system's appearance switches, so a class such as `bg-ground` is right in both
 * and no component writes `dark:`. `tests/tokenContrast.test.ts` holds both appearances to WCAG.
 *
 * Trim (DESIGN.md): the neutrals carry everything, food included. The last three are the only hues,
 * and say only where a day stands against its targets.
 */
module.exports = {
  light: {
    ground: '#F6F5F2',
    surface: '#FFFFFF',
    'surface-lift': '#ECEAE5',
    line: '#D9D6CF',
    'ink-dim': '#62646A',
    'ink-mid': '#4C4E52',
    ink: '#1B1C1E',
    within: '#0B6E78',
    'slightly-over': '#8F5400',
    over: '#B3261E',
  },
  dark: {
    ground: '#131416',
    surface: '#1C1E21',
    'surface-lift': '#282B2F',
    line: '#3A3E44',
    'ink-dim': '#9A9CA1',
    'ink-mid': '#B9BABD',
    ink: '#F1EFEA',
    within: '#5CC4CE',
    'slightly-over': '#E5A84B',
    over: '#FF5A4F',
  },
};
