import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';

export default function Today() {
  return (
    <SafeAreaView className="flex-1 bg-ground px-4" edges={['top']}>
      <Text accessibilityRole="header" className="text-title text-ink">
        Today
      </Text>
    </SafeAreaView>
  );
}
