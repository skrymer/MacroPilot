/**
 * Every colour in the app, once per appearance. `tailwind.config.js` turns each token into a CSS
 * variable that the system's appearance switches, so a class such as `bg-ground` is right in both
 * and no component writes `dark:`. `tests/tokenContrast.test.ts` holds both appearances to WCAG.
 *
 * Trim (DESIGN.md): the pine-tinted neutrals carry everything, food included. `within`,
 * `slightly-over` and `over` say only where a day stands against its targets; `valid` and `fault`
 * only how a field or an action fared. The two pairs share their values for now and are kept apart
 * so that a field and a day can part later.
 */
module.exports = {
  light: {
    ground: '#F8FAF9',
    surface: '#FFFFFF',
    'surface-lift': '#F1F5F3',
    line: '#E2E8E5',
    'ink-dim': '#5F6E68',
    'ink-mid': '#5A6B64',
    ink: '#16211D',
    within: '#2E7D5B',
    'slightly-over': '#8F5400',
    over: '#B3261E',
    valid: '#2E7D5B',
    fault: '#B3261E',
  },
  dark: {
    ground: '#111614',
    surface: '#1A221F',
    'surface-lift': '#222C28',
    line: '#28342F',
    'ink-dim': '#8D9E97',
    'ink-mid': '#99ABA3',
    ink: '#F0F5F2',
    within: '#4ADE99',
    'slightly-over': '#E5A84B',
    over: '#FF5A4F',
    valid: '#4ADE99',
    fault: '#FF5A4F',
  },
};
