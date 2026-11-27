import { Platform } from 'react-native';

import { scaledBy } from './fontScaleCaps';

/** `font-language-bold`'s face, as a value: the header takes no class. */
export const TITLE_FACE = 'B612_700Bold';

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
      fontSize: ios ? 17 : scaledBy(fontScale, 'title'),
    },
    ...(!ios && { headerStyle: { backgroundColor: tint.ground }, headerShadowVisible: false }),
  };
}
