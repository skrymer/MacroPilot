import { Stack } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';

import { barHeader, TITLE_FACE } from './barHeader';
import { systemScaledBy } from './fontScaleCaps';
import { useTint } from './useTint';

/**
 * A tab's page under the system's header (DESIGN.md, *Pages*): iOS's large title, collapsing into
 * its glass bar as the page scrolls under it; Android's small top app bar.
 */
export function PageStack({ title }: { title: string }) {
  const tint = useTint();
  const { fontScale } = useWindowDimensions();
  return (
    <Stack
      screenOptions={{
        title,
        contentStyle: { backgroundColor: tint.ground },
        ...barHeader(tint, fontScale),
        // iOS draws a title in a family of ours at a fixed size, so the large one is scaled here,
        // from its own.
        ...(Platform.OS === 'ios' && {
          headerLargeTitleEnabled: true,
          headerLargeTitleStyle: {
            fontFamily: TITLE_FACE,
            color: tint.ink,
            fontSize: systemScaledBy(fontScale, 34),
          },
        }),
      }}
    />
  );
}
