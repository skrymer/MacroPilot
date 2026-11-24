import { useRouter } from 'expo-router';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { grams, kcal, spokenGrams, spokenKcal } from '@/components/figures';
import { Text } from '@/components/Text';
import { caloriesPer100g, type Food } from '@/domain/food';
import { shownName } from '@/domain/shownName';
import { useFoods } from '@/storage/useFoods';

function FoodRow({ food: { name, macros } }: { food: Food }) {
  const calories = caloriesPer100g(macros);
  return (
    <View
      accessible
      accessibilityLabel={`${shownName(name)}, ${spokenKcal(calories)}, ${spokenGrams(macros.protein)} of protein per 100 grams`}
      className="min-h-target flex-row flex-wrap items-center justify-between gap-x-4 py-3"
    >
      <View className="min-w-name flex-1">
        <Text className="font-language text-body text-ink">{shownName(name)}</Text>
        <Text className="font-language text-label text-ink-mid">
          {`${grams(macros.protein)} protein per 100 g`}
        </Text>
      </View>
      <Text className="font-weighed text-body text-ink">{kcal(calories)}</Text>
    </View>
  );
}

const Hairline = () => <View className="border-t border-line" />;

type Said = { title: string; detail?: string; action: string; onAction: () => void };

/** What the page says where it has no list to show, and the way on from there. */
function Notice({ title, detail, action, onAction }: Said) {
  return (
    <View className="gap-4 rounded-2xl bg-surface p-4">
      <View>
        <Text className="font-language-bold text-body text-ink">{title}</Text>
        {detail ? <Text className="font-language text-label text-ink-mid">{detail}</Text> : null}
      </View>
      <Button label={action} onPress={onAction} />
    </View>
  );
}

export default function Foods() {
  const router = useRouter();
  const { foods, readAgain } = useFoods();
  // Not `push`, which opens a second form over the first when it is pressed twice.
  const addFood = () => router.navigate('/add-food');
  const listed = Array.isArray(foods) ? foods : [];
  const emptyNotice = {
    unread: undefined,
    unreadable: (
      <Notice title="Your foods could not be read" action="Try again" onAction={readAgain} />
    ),
    none: (
      <Notice
        title="No foods yet"
        detail="Add the foods you eat regularly, so logging takes a press and a figure."
        action="Add food"
        onAction={addFood}
      />
    ),
  };
  return (
    <SafeAreaView className="flex-1 bg-ground" edges={['top']}>
      {/* The page's first child and there from the start, or iOS finds no list to keep clear of its tab bar. */}
      <FlatList
        data={listed}
        keyExtractor={({ id }) => String(id)}
        renderItem={({ item }) => <FoodRow food={item} />}
        contentContainerClassName="px-4 pb-4"
        ItemSeparatorComponent={Hairline}
        ListHeaderComponent={
          <View className="min-h-target flex-row flex-wrap items-center justify-between gap-x-4">
            <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
              Foods
            </Text>
            {listed.length > 0 ? <Button label="Add food" onPress={addFood} /> : null}
          </View>
        }
        ListEmptyComponent={emptyNotice[typeof foods === 'string' ? foods : 'none']}
      />
    </SafeAreaView>
  );
}
