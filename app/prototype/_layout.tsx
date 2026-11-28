// THROWAWAY: the prototypes' own stack, so each page is presented as the app's are.
import { Stack } from 'expo-router';

import { usePagePresentation } from '@/components/PageStack';

export default function PrototypeLayout() {
  const page = usePagePresentation();
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="suspended" options={{ ...page, title: 'Today' }} />
    </Stack>
  );
}
