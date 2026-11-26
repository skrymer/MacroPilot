import { Stack } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';

import { scaledBy, systemScaledBy } from './fontScaleCaps';
import { useTint } from './useTint';

/** `font-language-bold`'s face, as a value: the header takes no class. */
const TITLE_FACE = 'B612_700Bold';

/**
 * A tab's page under the system's header (DESIGN.md, *Pages*): iOS's large title, collapsing into
 * its glass bar as the page scrolls under it; Android's small top app bar. The header takes values,
 * not classes. iOS's bar is given no colour, which would make it opaque.
 */
export function PageStack({ title }: { title: string }) {
  const tint = useTint();
  const { fontScale } = useWindowDimensions();
  const titleStyle = { fontFamily: TITLE_FACE, color: tint.ink };
  return (
    <Stack
      screenOptions={{
        title,
        headerTintColor: tint.ink,
        contentStyle: { backgroundColor: tint.ground },
        ...Platform.select({
          // iOS draws a title in a family of ours at a fixed size, so the large one is scaled here,
          // from its own. The one in the bar stays at 17, as UIKit keeps it in a bar of fixed height.
          ios: {
            headerTitleStyle: { ...titleStyle, fontSize: 17 },
            headerLargeTitleEnabled: true,
            headerLargeTitleStyle: { ...titleStyle, fontSize: systemScaledBy(fontScale, 34) },
          },
          // Material's top app bar is flat at rest. Its title kept one size at every text size, so
          // it is scaled here.
          default: {
            headerTitleStyle: { ...titleStyle, fontSize: scaledBy(fontScale, 'title') },
            headerStyle: { backgroundColor: tint.ground },
            headerShadowVisible: false,
          },
        }),
      }}
    />
  );
}
