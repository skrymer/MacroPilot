import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

type Sign = { ios: SFSymbol; android: AndroidSymbol };

/**
 * The two signs that go with a hue, so it is never alone (DESIGN.md, *Asking and telling*): red with
 * the warning is *needs you*, green with the tick is *done*, the same everywhere they appear.
 */
export const FAULT_SIGN: Sign = { ios: 'exclamationmark.triangle.fill', android: 'warning' };
export const VALID_SIGN: Sign = { ios: 'checkmark.circle.fill', android: 'check_circle' };
