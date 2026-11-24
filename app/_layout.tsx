import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { ClockProvider } from '@/lifecycle/ClockContext';
import { SystemClock } from '@/lifecycle/SystemClock';

import '../global.css';

const clock = new SystemClock();

export default function RootLayout() {
  return (
    <ClockProvider clock={clock}>
      <View className="flex-1 bg-ground">
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </View>
    </ClockProvider>
  );
}
