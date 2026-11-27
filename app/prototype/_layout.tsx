// THROWAWAY: epic 2's prototypes' own stack, so each page and form is presented as the app's are.
import { Stack } from 'expo-router';

import { useFormPresentation } from '@/components/FormHeader';
import { usePagePresentation } from '@/components/PageStack';

export default function PrototypeLayout() {
  const page = usePagePresentation();
  const form = useFormPresentation();
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="today-targets" options={{ ...page, title: 'Today' }} />
      <Stack.Screen name="profile" options={{ ...page, title: 'Profile' }} />
      <Stack.Screen name="over-line" options={form} />
    </Stack>
  );
}
