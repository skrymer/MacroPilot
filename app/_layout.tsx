import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { ClockProvider } from '@/lifecycle/ClockContext';
import { SystemClock } from '@/lifecycle/SystemClock';

import '../global.css';

const clock = new SystemClock();

/**
 * Stands in a release build for a page of a development one, since Expo Router ships every route
 * file. It goes back to the Today already open, where `Redirect` and `Stack.Protected` would each
 * stack another over it.
 */
function BackToToday() {
  const router = useRouter();
  useFocusEffect(() => router.dismissTo('/'));
  return null;
}

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
          screenLayout={({ route, children }) =>
            !__DEV__ && route.name === 'design' ? <BackToToday /> : children
          }
        />
      </View>
    </ClockProvider>
  );
}
