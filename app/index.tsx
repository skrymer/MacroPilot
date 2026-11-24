import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';

export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-ground px-4">
      <Text accessibilityRole="header" className="text-title text-ink">
        MacroPilot
      </Text>
    </SafeAreaView>
  );
}
