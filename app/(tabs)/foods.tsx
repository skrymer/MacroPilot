import { useRouter } from 'expo-router';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { DeleteButton } from '@/components/DeleteButton';
import { FoodRow } from '@/components/FoodRow';
import { FoodsNotice } from '@/components/FoodsNotice';
import { Hairline } from '@/components/Hairline';
import { Text } from '@/components/Text';
import { useDelete } from '@/components/useDelete';
import { shownName } from '@/domain/shownName';
import { useFoodStore } from '@/storage/FoodStoreContext';
import { useFoods } from '@/storage/useFoods';

export default function Foods() {
  const router = useRouter();
  const store = useFoodStore();
  const { foods, readAgain } = useFoods();
  const listed = Array.isArray(foods) ? foods : [];
  const deletion = useDelete({
    title: 'Delete this food?',
    remove: (id) => store.delete(id),
    onDeleted: readAgain,
  });
  return (
    <SafeAreaView className="flex-1 bg-ground" edges={['top']}>
      {/* The page's first child and there from the start, or iOS finds no list to keep clear of its tab bar. */}
      <FlatList
        data={listed}
        keyExtractor={({ id }) => String(id)}
        renderItem={({ item }) => {
          const name = shownName(item.name);
          const gone = `${name} will be removed from your catalog.`;
          return (
            <View className="flex-row flex-wrap items-center justify-between gap-x-4">
              <View className="min-w-name flex-1">
                {item.id === deletion.failed ? (
                  <Text accessibilityRole="alert" className="font-language-bold text-body text-ink">
                    Could not delete food
                  </Text>
                ) : null}
                <FoodRow food={item} />
              </View>
              <DeleteButton name={name} onPress={() => void deletion.begin(item.id, gone)} />
            </View>
          );
        }}
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
