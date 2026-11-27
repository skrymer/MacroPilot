import { Stack } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';

import { barHeader, TITLE_FACE } from './barHeader';
import { systemScaledBy } from './fontScaleCaps';
import { useTint } from './useTint';

/**
 * How a page is presented, a tab's or one on the root stack (DESIGN.md, *Pages*): on the ground,
 * under the system's header, with iOS's large title collapsing into its glass bar as the page
 * scrolls under it; Android's small top app bar. A route outside a tab is given it in the layout.
 */
export function usePagePresentation() {
  const tint = useTint();
  const { fontScale } = useWindowDimensions();
  return {
    headerShown: true,
    contentStyle: { backgroundColor: tint.ground },
    ...barHeader(tint, fontScale),
    // iOS draws a title in a family of ours at a fixed size, so the large one is scaled here, from
    // its own.
    ...(Platform.OS === 'ios' && {
      headerLargeTitleEnabled: true,
      headerLargeTitleStyle: {
        fontFamily: TITLE_FACE,
        color: tint.ink,
        fontSize: systemScaledBy(fontScale, 34),
      },
    }),
  } as const;
}

/** A tab's pages, each presented as a page under the given title. */
export function PageStack({ title }: { title: string }) {
  const page = usePagePresentation();
  return <Stack screenOptions={{ ...page, title }} />;
}
