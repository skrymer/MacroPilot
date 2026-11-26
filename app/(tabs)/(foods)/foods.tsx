import { useRouter } from 'expo-router';
import { FlatList, View } from 'react-native';

import { Button } from '@/components/Button';
import { CardSlice } from '@/components/CardSlice';
import { Hairline } from '@/components/Hairline';
import { DeletableRow } from '@/components/DeletableRow';
import { FoodRow } from '@/components/FoodRow';
import { FoodsNotice } from '@/components/FoodsNotice';
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
    // The page's root and there from the start, or iOS finds no list to keep clear of its bars.
    <FlatList
      {...faultInView.list}
      // iOS's large title follows the scroll only with the insets its bars ask for.
      contentInsetAdjustmentBehavior="automatic"
      data={listed}
      keyExtractor={({ id }) => String(id)}
      renderItem={({ item, index }) => (
        <CardSlice first={index === 0} last={index === listed.length - 1}>
          <DeletableRow
            ref={item.id === deletion.fault?.id ? faultInView.row : undefined}
            onDelete={() => void deletion.begin(item)}
            fault={item.id === deletion.fault?.id ? deletion.fault.why : undefined}
          >
            <FoodRow food={item} onDelete={() => void deletion.begin(item)} />
          </DeletableRow>
        </CardSlice>
      )}
      contentContainerClassName="px-page py-grid-2"
      ItemSeparatorComponent={Hairline}
      ListHeaderComponent={
        listed.length > 0 ? (
          <View className="pb-grid-2">
            {/* Not `push`, which opens a second form over the first when it is pressed twice. */}
            <Button label="Add food" onPress={() => router.navigate('/add-food')} />
          </View>
        ) : undefined
      }
      ListEmptyComponent={<FoodsNotice foods={foods} readAgain={readAgain} />}
    />
  );
}
