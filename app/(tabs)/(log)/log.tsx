import { useNavigation, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, FlatList, Platform, View } from 'react-native';

import { Button } from '@/components/Button';
import { CardSlice } from '@/components/CardSlice';
import { entryFigures } from '@/components/entryWords';
import { FoodRow } from '@/components/FoodRow';
import { FoodsNotice } from '@/components/FoodsNotice';
import { Hairline } from '@/components/Hairline';
import { useLogged, type Logged } from '@/components/LoggedContext';
import { VALID_SIGN } from '@/components/signs';
import { Text } from '@/components/Text';
import { useTint } from '@/components/useTint';
import type { Food } from '@/domain/food';
import { shownName } from '@/domain/shownName';
import { useFoods } from '@/storage/useFoods';

function LoggedLine({ logged: { name, entry } }: { logged: Logged }) {
  const title = `Logged: ${shownName(name)}`;
  const words = entryFigures(entry);
  const spoken = `${title}, ${words.spoken}`;
  const tint = useTint();
  // Android announces a live region as it changes, and iOS has none.
  useEffect(() => {
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(spoken);
  }, [spoken]);
  return (
    <View
      accessible
      accessibilityLabel={spoken}
      accessibilityLiveRegion="polite"
      className="flex-row items-center gap-grid-2 rounded-card bg-surface p-grid-2"
    >
      <SymbolView name={VALID_SIGN} size={22} tintColor={tint.valid} />
      <View className="flex-1">
        <Text className="font-language-bold text-body text-ink">{title}</Text>
        <Text className="font-language text-label text-ink-mid">{words.shown}</Text>
      </View>
    </View>
  );
}

export default function Log() {
  const router = useRouter();
  const navigation = useNavigation();
  const { foods, readAgain } = useFoods();
  const listed = Array.isArray(foods) ? foods : [];
  const [logged, setLogged] = useLogged();
  // Asked of the tabs, the parent of Log's own stack, rather than of focus: a food's form opens over
  // Log, and Log is not left by it.
  const tabs = navigation.getParent();
  useEffect(
    () =>
      tabs?.addListener('state', ({ data: { state } }) => {
        if (state.routes[state.index]?.name !== '(log)') setLogged(undefined);
      }),
    [tabs, setLogged],
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
    <FlatList
      ref={list}
      // iOS's large title follows the scroll only with the insets its bars ask for.
      contentInsetAdjustmentBehavior="automatic"
      data={listed}
      keyExtractor={({ id }) => String(id)}
      renderItem={({ item, index }) => (
        <CardSlice first={index === 0} last={index === listed.length - 1}>
          <FoodRow food={item} onLog={() => openForm(item.id)} />
        </CardSlice>
      )}
      contentContainerClassName="px-page py-grid-2"
      ItemSeparatorComponent={Hairline}
      ListEmptyComponent={
        <View className="pt-grid-2">
          <FoodsNotice foods={foods} readAgain={readAgain} />
        </View>
      }
      ListHeaderComponent={
        <View className="gap-grid-2">
          {logged ? <LoggedLine logged={logged} /> : null}
          <Button
            label="Log an estimate instead"
            onPress={() => router.navigate('/log-estimate')}
            secondary
          />
          {listed.length > 0 ? (
            <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
              All foods
            </Text>
          ) : null}
        </View>
      }
    />
  );
}
