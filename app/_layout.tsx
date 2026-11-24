// One face at a time, from the per-face entry point: the package root ships every weight.
import { B612_400Regular } from '@expo-google-fonts/b612/400Regular';
import { B612_400Regular_Italic } from '@expo-google-fonts/b612/400Regular_Italic';
import { B612_700Bold } from '@expo-google-fonts/b612/700Bold';
import { useFonts } from 'expo-font';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { openDatabaseAsync } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { ClockProvider } from '@/lifecycle/ClockContext';
import { SystemClock } from '@/lifecycle/SystemClock';
import { FoodStoreProvider } from '@/storage/FoodStoreContext';
import { LazyDatabase } from '@/storage/LazyDatabase';
import { SqliteFoodStore } from '@/storage/SqliteFoodStore';

import '../global.css';

const clock = new SystemClock();
const database = new LazyDatabase(() => openDatabaseAsync('macropilot.db'));
const foodStore = new SqliteFoodStore(database);

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
  const [loaded, failed] = useFonts({ B612_400Regular, B612_400Regular_Italic, B612_700Bold });
  // Text measured in the system's face and then drawn in its own is clipped, and stays so. Faces that
  // fail to load leave the system's.
  if (!loaded && !failed) return null;
  return (
    <ClockProvider clock={clock}>
      <FoodStoreProvider store={foodStore}>
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
      </FoodStoreProvider>
    </ClockProvider>
  );
}
