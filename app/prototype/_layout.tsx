// THROWAWAY: the prototype's own stack (#51), so a form can open as the platform presents one.
import { Stack } from 'expo-router';

import { useFormPresentation } from '@/components/FormHeader';

/** `modal` is iOS's page sheet, and on Android a page that rises over the last. */
export default function PrototypeLayout() {
  const form = useFormPresentation();
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="form" options={{ presentation: 'modal' }} />
      <Stack.Screen name="grams" options={form} />
    </Stack>
  );
}
