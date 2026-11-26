import { Stack } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';

import { CancelButton } from './CancelButton';
import { scaledBy } from './fontScaleCaps';
import { useTint } from './useTint';

/** `font-language-bold`'s face, as a value: the header takes no class. */
const TITLE_FACE = 'B612_700Bold';

/**
 * How every form is presented, given to its route in the layout (DESIGN.md, *Forms*): iOS's page
 * sheet and Android's page rising over the last, under the system's header. Declared there and not by
 * the page, which would show the header from inside what it lays out, and set it again on each layout.
 */
export function useFormPresentation() {
  const tint = useTint();
  const { fontScale } = useWindowDimensions();
  return {
    presentation: 'modal',
    headerShown: true,
    headerTintColor: tint.ink,
    headerTitleStyle: {
      fontFamily: TITLE_FACE,
      color: tint.ink,
      // Material's top app bar keeps one size at every text size, so it is scaled here; iOS keeps a
      // bar's title at 17.
      fontSize: Platform.OS === 'ios' ? 17 : scaledBy(fontScale, 'title'),
    },
    headerStyle: Platform.OS === 'ios' ? undefined : { backgroundColor: tint.ground },
    headerShadowVisible: false,
  } as const;
}

/**
 * A form's title and its way out at the top left, set by the page that owns them: on iOS the
 * system's own round glass X, heard as *Cancel*, since a button of ours is wrapped in a glass pill
 * that does not fit it; on Android Material's close X.
 */
export function FormHeader({ title, onCancel }: { title: string; onCancel: () => void }) {
  const tint = useTint();
  return (
    <Stack.Screen
      options={{
        title,
        headerLeft: () => <CancelButton onPress={onCancel} />,
        unstable_headerLeftItems: () => [
          {
            type: 'button',
            label: 'Cancel',
            icon: { type: 'sfSymbol', name: 'xmark' },
            onPress: onCancel,
            tintColor: tint.ink,
          },
        ],
      }}
    />
  );
}
