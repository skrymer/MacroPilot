// THROWAWAY: the prototype's own stack (#51), so a form can open as the platform presents one.
import { Stack } from 'expo-router';

/** `modal` is iOS's page sheet, and on Android a page that rises over the last. */
export default function PrototypeLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="form" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
