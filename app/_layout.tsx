// One face at a time, from the per-face entry point: the package root ships every weight.
import { B612_400Regular } from '@expo-google-fonts/b612/400Regular';
import { B612_400Regular_Italic } from '@expo-google-fonts/b612/400Regular_Italic';
import { B612_700Bold } from '@expo-google-fonts/b612/700Bold';
import { useFonts } from 'expo-font';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { openDatabaseAsync } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AskProvider } from '@/components/AskContext';
import { useFormPresentation } from '@/components/FormHeader';
import { LoggedProvider } from '@/components/LoggedContext';
import { usePagePresentation } from '@/components/PageStack';
import { SystemAsk } from '@/components/SystemAsk';
import { ClockProvider } from '@/lifecycle/ClockContext';
import { SystemClock } from '@/lifecycle/SystemClock';
import { EntryStoreProvider } from '@/storage/EntryStoreContext';
import { FoodStoreProvider } from '@/storage/FoodStoreContext';
import { LazyDatabase } from '@/storage/LazyDatabase';
import { ProfileStoreProvider } from '@/storage/ProfileStoreContext';
import { SqliteEntryStore } from '@/storage/SqliteEntryStore';
import { SqliteFoodStore } from '@/storage/SqliteFoodStore';
import { SqliteProfileStore } from '@/storage/SqliteProfileStore';
import { SqliteWeighInStore } from '@/storage/SqliteWeighInStore';
import { WeighInStoreProvider } from '@/storage/WeighInStoreContext';

import '../global.css';

// NativeWind's runtime registers ImageBackground as it loads, which React Native warns of on every
// launch; its toast lies over the foot of a form. Not ours to fix, so this one message alone is let go.
LogBox.ignoreLogs(['ImageBackground is deprecated']);

const clock = new SystemClock();
const database = new LazyDatabase(() => openDatabaseAsync('macropilot.db'));
const foodStore = new SqliteFoodStore(database);
const entryStore = new SqliteEntryStore(database);
const profileStore = new SqliteProfileStore(database);
const weighInStore = new SqliteWeighInStore(database);
const ask = new SystemAsk();

/**
 * What a release build sends to Today: the design page and a prototype under `app/prototype/`, which
 * only a development build opens, and a link that matches no page.
 */
const TODAY_IN_RELEASE = /^(design|prototype|\+not-found)(\/|$)/;

/**
 * Stands in a release build for a page `TODAY_IN_RELEASE` matches. It goes back to the Today already
 * open, where `Redirect` and `Stack.Protected` would each stack another over it, and opens Today when
 * none is, as on a cold start from a link.
 */
function BackToToday() {
  const router = useRouter();
  useFocusEffect(() => router.dismissTo('/'));
  return null;
}

export default function RootLayout() {
  const [loaded, failed] = useFonts({ B612_400Regular, B612_400Regular_Italic, B612_700Bold });
  const form = useFormPresentation();
  const page = usePagePresentation();
  // Text measured in the system's face and then drawn in its own is clipped, and stays so. Faces that
  // fail to load leave the system's.
  if (!loaded && !failed) return null;
  return (
    <ClockProvider clock={clock}>
      <FoodStoreProvider store={foodStore}>
        <EntryStoreProvider store={entryStore}>
          <ProfileStoreProvider store={profileStore}>
            <WeighInStoreProvider store={weighInStore}>
              <AskProvider ask={ask}>
                <LoggedProvider>
                  {/* Gestures are seen only under this root, the swipe on a row and the list's scroll as one. */}
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <View className="flex-1 bg-ground">
                      <StatusBar style="auto" />
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          contentStyle: { backgroundColor: 'transparent' },
                        }}
                        screenLayout={({ route, children }) =>
                          !__DEV__ && TODAY_IN_RELEASE.test(route.name) ? <BackToToday /> : children
                        }
                      >
                        {/* DESIGN.md, Forms: every form is iOS's page sheet and Android's page rising
                          over the last (the user's word, 26 November 2026). */}
                        <Stack.Screen name="add-food" options={form} />
                        <Stack.Screen name="log-food" options={form} />
                        <Stack.Screen name="log-estimate" options={form} />
                        <Stack.Screen name="details" options={form} />
                        <Stack.Screen name="log-weight" options={form} />
                        {/* DESIGN.md, Pages: the design page stands under the system's header, as a
                          tab's page does. */}
                        <Stack.Screen name="design" options={{ ...page, title: 'Trim' }} />
                      </Stack>
                    </View>
                  </GestureHandlerRootView>
                </LoggedProvider>
              </AskProvider>
            </WeighInStoreProvider>
          </ProfileStoreProvider>
        </EntryStoreProvider>
      </FoodStoreProvider>
    </ClockProvider>
  );
}
