// THROWAWAY: a form as the platform presents one (#51). See app/prototype/NOTES.md.
import { Stack, useRouter } from 'expo-router';
import { vars } from 'nativewind';
import { useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { variablesOf } from '../../prototype-palettes';

import { CHOSEN, Form, HeaderCancel, headerFor } from './colours';

export default function FormPrototype() {
  const router = useRouter();
  const palette = CHOSEN[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const leave = () => router.back();
  return (
    <View style={vars(variablesOf(palette))} className="flex-1 bg-ground">
      <Stack.Screen
        options={{
          ...headerFor(palette, 'Log an estimate'),
          // Android: Material's close X, ours.
          headerLeft: () => <HeaderCancel ink={palette.ink} onPress={leave} />,
          // Decided 26 November 2026: iOS's own round X, heard as Cancel, as Apple's sheets have it
          // since iOS 26. A button of ours is wrapped in a glass pill that does not fit it.
          unstable_headerLeftItems: () => [
            {
              type: 'button',
              label: 'Cancel',
              icon: { type: 'sfSymbol', name: 'xmark' },
              onPress: leave,
              tintColor: palette.ink,
            },
          ],
        }}
      />
      <SafeAreaView className="flex-1" edges={['bottom']}>
        {/* Decided 26 November 2026: a field's edge at rest is 3:1, the `edge` token. */}
        <Form faultStyle="colour-one" palette={palette} edge="soft" />
      </SafeAreaView>
    </View>
  );
}
