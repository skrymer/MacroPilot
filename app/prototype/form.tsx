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
  return (
    <View style={vars(variablesOf(palette))} className="flex-1 bg-ground">
      <Stack.Screen
        options={{
          ...headerFor(palette, 'Log an estimate'),
          headerLeft: () => <HeaderCancel ink={palette.ink} onPress={() => router.back()} />,
        }}
      />
      <SafeAreaView className="flex-1" edges={['bottom']}>
        <Form faultStyle="colour-one" palette={palette} />
      </SafeAreaView>
    </View>
  );
}
