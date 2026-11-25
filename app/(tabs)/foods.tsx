import { useRouter } from 'expo-router';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { DeletableRow } from '@/components/DeletableRow';
import { FoodRow } from '@/components/FoodRow';
import { FoodsNotice } from '@/components/FoodsNotice';
import { Hairline } from '@/components/Hairline';
import { Text } from '@/components/Text';
import { useDelete } from '@/components/useDelete';
import { useFailedInView } from '@/components/useFailedInView';
import type { Food } from '@/domain/food';
import { shownName } from '@/domain/shownName';
import { useFoodStore } from '@/storage/FoodStoreContext';
import { useFoods } from '@/storage/useFoods';

const FAILED = 'Could not delete food';

export default function Foods() {
  const router = useRouter();
  const store = useFoodStore();
  const { foods, readAgain } = useFoods();
  const listed = Array.isArray(foods) ? foods : [];
  const deletion = useDelete<Food>({
    title: 'Delete this food?',
    message: ({ name }) =>
      `${shownName(name)} will be removed from your catalog. A food you’ve logged entries against can’t be deleted — your entries depend on it.`,
    remove: async ({ id, name }) => {
      if ((await store.delete(id)) === 'logged') {
        return `${FAILED}. ${shownName(name)} has logged Entries and can’t be deleted.`;
      }
    },
    failed: FAILED,
    onDeleted: readAgain,
  });
  const faultInView = useFailedInView(listed, deletion.fault);
  return (
    <SafeAreaView className="flex-1 bg-ground" edges={['top']}>
      {/* The page's first child and there from the start, or iOS finds no list to keep clear of its tab bar. */}
      <FlatList
        {...faultInView.list}
        data={listed}
        keyExtractor={({ id }) => String(id)}
        renderItem={({ item }) => (
          <DeletableRow
            ref={item.id === deletion.fault?.id ? faultInView.row : undefined}
            name={shownName(item.name)}
            onDelete={() => void deletion.begin(item)}
            fault={item.id === deletion.fault?.id ? deletion.fault.why : undefined}
          >
            <FoodRow food={item} />
          </DeletableRow>
        )}
        contentContainerClassName="px-4 pb-4"
        ItemSeparatorComponent={Hairline}
        ListHeaderComponent={
          <View className="min-h-target flex-row flex-wrap items-center justify-between gap-x-4">
            <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
              Foods
            </Text>
            {listed.length > 0 ? (
              // Not `push`, which opens a second form over the first when it is pressed twice.
              <Button label="Add food" onPress={() => router.navigate('/add-food')} />
            ) : null}
          </View>
        }
        ListEmptyComponent={<FoodsNotice foods={foods} readAgain={readAgain} />}
      />
    </SafeAreaView>
  );
}
