import type { PressableAndroidRippleConfig } from 'react-native';

import { useTint } from './useTint';

/** Material 3's pressed state layer: the content's colour at 10%, as a hex alpha. */
const PRESSED = '1A';

/**
 * Android's press (DESIGN.md, *Controls*): Material's state layer, in the colour of what the control
 * holds, `ground` on a filled button and `ink` on the page or a card. The system's own is dark over
 * dark `ink` in light, and shows nothing; at full strength it hides the label. iOS dims instead, by
 * the control's `ios:active:opacity-60`.
 */
export function useRipple(over: 'ink' | 'page'): PressableAndroidRippleConfig {
  const tint = useTint();
  return { color: `${over === 'ink' ? tint.ground : tint.ink}${PRESSED}`, foreground: true };
}
