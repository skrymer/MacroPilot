import { Stack } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { barHeader } from './barHeader';
import { CancelButton } from './CancelButton';
import { useTint } from './useTint';

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
    ...barHeader(tint, fontScale),
    // A sheet's bar is flat on iOS too, as Apple's own sheets are; Android's already is.
    headerShadowVisible: false,
  } as const;
}

/**
 * A form's title and its way out at the top left, set by the page that owns them: on iOS the
 * system's own round glass X, heard as *Cancel*, since a button of ours is wrapped in a glass pill
 * that does not fit it; on Android Material's close X. Both take the bar's ink, which it hands them.
 */
export function FormHeader({ title, onCancel }: { title: string; onCancel: () => void }) {
  return (
    <Stack.Screen
      options={{
        title,
        headerLeft: ({ tintColor }) => <CancelButton onPress={onCancel} tint={tintColor} />,
        unstable_headerLeftItems: ({ tintColor }) => [
          {
            type: 'button',
            label: 'Cancel',
            icon: { type: 'sfSymbol', name: 'xmark' },
            onPress: onCancel,
            tintColor,
          },
        ],
      }}
    />
  );
}
