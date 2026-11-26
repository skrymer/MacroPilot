/**
 * THROWAWAY: the candidate palettes of the colours prototype (#51), outside `app/` because they are
 * candidate tokens, as `design-tokens.js` holds the real ones. Deleted with the prototype.
 *
 * Every pair a text is set in is at least 4.5:1 in both appearances, measured 26 November 2026.
 */
type Palette = Record<
  | 'ground'
  | 'surface'
  | 'surface-lift'
  | 'line'
  | 'ink-dim'
  | 'ink-mid'
  | 'ink'
  | 'within'
  | 'slightly-over'
  | 'over',
  string
>;

export type Candidate = { key: string; name: string; light: Palette; dark: Palette };

const TRIM_HUES = {
  light: { 'slightly-over': '#8F5400', over: '#B3261E' },
  dark: { 'slightly-over': '#E5A84B', over: '#FF5A4F' },
};

/** The user's palette of 26 November 2026: its neutrals only, `ink-dim` darkened to pass. */
const PINE = {
  light: {
    ground: '#F8FAF9',
    surface: '#FFFFFF',
    'surface-lift': '#F1F5F3',
    line: '#E2E8E5',
    'ink-dim': '#5F6E68',
    'ink-mid': '#5A6B64',
    ink: '#16211D',
  },
  dark: {
    ground: '#111614',
    surface: '#1A221F',
    'surface-lift': '#222C28',
    line: '#28342F',
    'ink-dim': '#8D9E97',
    'ink-mid': '#99ABA3',
    ink: '#F0F5F2',
  },
};

export const CANDIDATES: Candidate[] = [
  {
    key: 'A',
    name: 'Trim now: warm, teal',
    light: {
      ground: '#F6F5F2',
      surface: '#FFFFFF',
      'surface-lift': '#ECEAE5',
      line: '#D9D6CF',
      'ink-dim': '#62646A',
      'ink-mid': '#4C4E52',
      ink: '#1B1C1E',
      within: '#0B6E78',
      ...TRIM_HUES.light,
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
      ...TRIM_HUES.dark,
    },
  },
  {
    key: 'B',
    name: 'Pine, teal tuned to it',
    light: { ...PINE.light, within: '#1F7A70', ...TRIM_HUES.light },
    dark: { ...PINE.dark, within: '#5CCFC0', ...TRIM_HUES.dark },
  },
  {
    key: 'C',
    name: 'Pine, emerald',
    light: { ...PINE.light, within: '#2E7D5B', ...TRIM_HUES.light },
    dark: { ...PINE.dark, within: '#4ADE99', ...TRIM_HUES.dark },
  },
  {
    key: 'D',
    name: 'Health grey, teal',
    light: {
      ground: '#F2F2F7',
      surface: '#FFFFFF',
      'surface-lift': '#E9E9EE',
      line: '#C6C6C8',
      'ink-dim': '#5E5E63',
      'ink-mid': '#48484D',
      ink: '#1C1C1E',
      within: '#0B6E78',
      ...TRIM_HUES.light,
    },
    dark: {
      ground: '#000000',
      surface: '#1C1C1E',
      'surface-lift': '#2C2C2E',
      line: '#38383A',
      'ink-dim': '#A0A0A5',
      'ink-mid': '#C2C2C7',
      ink: '#F5F5F7',
      within: '#5CC4CE',
      ...TRIM_HUES.dark,
    },
  },
];

/** `#RRGGBB` as the channels the token classes' `rgb(var(--color-…) / …)` takes. */
const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');

/** A palette as the CSS variables `tailwind.config.js` reads each token class from. */
export const variablesOf = (palette: Palette) =>
  Object.fromEntries(
    Object.entries(palette).map(([name, hex]) => [`--color-${name}`, channels(hex)]),
  );
