import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, FlatList, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { grams, kcal, spokenGrams, spokenKcal } from '@/components/figures';
import { FoodRow } from '@/components/FoodRow';
import { FoodsNotice } from '@/components/FoodsNotice';
import { Hairline } from '@/components/Hairline';
import { useLogged, type Logged } from '@/components/LoggedContext';
import { Text } from '@/components/Text';
import type { Food } from '@/domain/food';
import { shownName } from '@/domain/shownName';
import { useFoods } from '@/storage/useFoods';

function LoggedLine({ logged: { name, entry } }: { logged: Logged }) {
  const spoken = `Logged: ${shownName(name)}, ${spokenGrams(entry.grams)}, ${spokenKcal(entry.calories)}, ${spokenGrams(entry.protein)} of protein`;
  // Android announces a live region as it changes, and iOS has none.
  useEffect(() => {
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(spoken);
  }, [spoken]);
  return (
    <View
      accessible
      accessibilityLabel={spoken}
      accessibilityLiveRegion="polite"
      className="rounded-2xl bg-surface p-4"
    >
      <Text className="font-language-bold text-body text-ink">{`Logged: ${shownName(name)}`}</Text>
      <Text className="font-language text-label text-ink-mid">
        {`${grams(entry.grams)}, ${kcal(entry.calories)}, ${grams(entry.protein)} protein`}
      </Text>
    </View>
  );
}

export default function Log() {
  const router = useRouter();
  const navigation = useNavigation();
  const { foods, readAgain } = useFoods();
  const listed = Array.isArray(foods) ? foods : [];
  const [logged, setLogged] = useLogged();
  // Asked of the tabs rather than of focus: a food's form opens over Log, and Log is not left by it.
  useEffect(
    () =>
      navigation.addListener('state', ({ data: { state } }) => {
        if (state.routes[state.index]?.name !== 'log') setLogged(undefined);
      }),
    [navigation, setLogged],
  );
  // The line is at the top of the page, which can be out of view of the food that was pressed.
  const list = useRef<ComponentRef<typeof FlatList<Food>>>(null);
  useEffect(() => {
    if (logged) list.current?.scrollToOffset({ offset: 0, animated: false });
  }, [logged]);
  const openForm = (id: number) => {
    // Not `push`, which opens a second form over the first when it is pressed twice.
    router.navigate({ pathname: '/log-food', params: { id } });
  };
  return (
    <SafeAreaView className="flex-1 bg-ground" edges={['top']}>
      <FlatList
        ref={list}
        data={listed}
        keyExtractor={({ id }) => String(id)}
        renderItem={({ item }) => <FoodRow food={item} onLog={() => openForm(item.id)} />}
        contentContainerClassName="px-4 pb-4"
        ItemSeparatorComponent={Hairline}
        ListEmptyComponent={<FoodsNotice foods={foods} readAgain={readAgain} />}
        ListHeaderComponent={
          <View className="gap-3">
            <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
              Log
            </Text>
            {logged ? <LoggedLine logged={logged} /> : null}
            {listed.length > 0 ? (
              <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
                All foods
              </Text>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}
