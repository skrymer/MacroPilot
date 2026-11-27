import { Platform } from 'react-native';

import { scaledBy } from './fontScaleCaps';

/** `font-language-bold`'s face, as a value: the header takes no class. */
export const TITLE_FACE = 'B612_700Bold';

/**
 * Where Material's bar title stops growing: its one line is 870px wide on a 1080px phone, and the
 * longest form title, *Log an estimate*, is 437px at text 1.0. Android scales the size it is given
 * again, on its own curve, so at double it was cut short, and at 1.8 too (ADR 0007).
 */
const BAR_CAP = 1.5;

/**
 * The system's bar over a page, tab or form (DESIGN.md, *Pages*), given values and not classes, what
 * it draws in ink. iOS keeps a bar's title at 17, as UIKit does in a bar of fixed height, and its bar
 * is given no colour, which would make it opaque. Material's top app bar is flat at rest, and its
 * title kept one size at every text size, so it is scaled here.
 */
export function barHeader(tint: Record<string, string>, fontScale: number) {
  const ios = Platform.OS === 'ios';
  return {
    headerTintColor: tint.ink,
    headerTitleStyle: {
      fontFamily: TITLE_FACE,
      color: tint.ink,
      fontSize: ios ? 17 : scaledBy(Math.min(fontScale, BAR_CAP), 'title'),
    },
    ...(!ios && { headerStyle: { backgroundColor: tint.ground }, headerShadowVisible: false }),
  };
}
