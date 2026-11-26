// THROWAWAY: a form as the platform presents one (#51). See app/prototype/NOTES.md.
import { Stack, useRouter } from 'expo-router';
import { vars } from 'nativewind';
import { useState } from 'react';
import { Platform, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { variablesOf } from '../../prototype-palettes';

import { CHOSEN, Chips, Form, HeaderCancel, headerFor, type Chip } from './colours';

type CancelStyle = 'ours' | 'system-word' | 'system-x';

/**
 * Q10, the way out of a form on iOS: ours, which iOS 26 wraps in a glass pill that does not fit it;
 * the system's own bar button with the word, in its face; or the system's round X, as Apple's own
 * sheets since iOS 26. Android keeps Material's close X.
 */
const CANCEL_STYLES: Chip<CancelStyle>[] = [
  { label: 'Our Cancel', value: 'ours' },
  { label: 'System Cancel', value: 'system-word' },
  { label: 'System X', value: 'system-x' },
];

export default function FormPrototype() {
  const router = useRouter();
  const palette = CHOSEN[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [cancelStyle, setCancelStyle] = useState<CancelStyle>('system-x');
  const leave = () => router.back();
  const system = Platform.OS === 'ios' && cancelStyle !== 'ours';
  return (
    <View style={vars(variablesOf(palette))} className="flex-1 bg-ground">
      <Stack.Screen
        options={{
          ...headerFor(palette, 'Log an estimate'),
          headerLeft: () => <HeaderCancel ink={palette.ink} onPress={leave} />,
          unstable_headerLeftItems: system
            ? () => [
                {
                  type: 'button',
                  label: 'Cancel',
                  onPress: leave,
                  tintColor: palette.ink,
                  ...(cancelStyle === 'system-x'
                    ? { icon: { type: 'sfSymbol', name: 'xmark' } }
                    : {}),
                },
              ]
            : undefined,
        }}
      />
      <SafeAreaView className="flex-1" edges={['bottom']}>
        <Form faultStyle="colour-one" palette={palette} />
        <View className="mx-2 mt-2 rounded-2xl border border-line bg-surface p-2">
          <Chips chips={CANCEL_STYLES} chosen={cancelStyle} onChoose={setCancelStyle} />
        </View>
      </SafeAreaView>
    </View>
  );
}
