import { useColorScheme } from 'react-native';

type Palette = Record<string, string>;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const TOKENS: { light: Palette; dark: Palette } = require('../../design-tokens');

/**
 * The palette in force, as values: for what takes a colour and not a class, such as a symbol's tint
 * or Android's ripple.
 */
export const useTint = () => TOKENS[useColorScheme() === 'dark' ? 'dark' : 'light'];
