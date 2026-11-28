import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { kcal } from '@/components/figures';
import { FoodsNotice } from '@/components/FoodsNotice';
import { FormField } from '@/components/FormField';
import { FormHeader } from '@/components/FormHeader';
import { FormPage } from '@/components/FormPage';
import { gramsForm } from '@/components/gramsForm';
import { Text } from '@/components/Text';
import { useLogEntry } from '@/components/useLogEntry';
import { totalsOf } from '@/domain/dailyLog';
import { weighedEntry } from '@/domain/entry';
import type { Food } from '@/domain/food';
import { reviewFor } from '@/domain/review';
import { shownName } from '@/domain/shownName';
import { overLine } from '@/domain/verdict';
import { useToday } from '@/lifecycle/useToday';
import { useEntryStore } from '@/storage/EntryStoreContext';
import { useFoods } from '@/storage/useFoods';
import { useReading } from '@/storage/useReading';
import { useReviews } from '@/storage/useReviews';

function GramsForm({ food }: { food: Food }) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(gramsForm),
    defaultValues: { grams: '' },
  });
  const { log, leave } = useLogEntry({
    form: { handleSubmit, setError },
    entryOn: ({ grams }, day) => ({ name: food.name, entry: weighedEntry(food, grams, day) }),
  });
  // The day so far and the budget it is held to, against which the grams being typed are judged.
  const today = useToday();
  const entries = useEntryStore();
  const list = useCallback(() => entries.listOn(today), [entries, today]);
  const { found } = useReading(list);
  const { reviews } = useReviews();
  const typed = gramsForm.safeParse({ grams: useWatch({ control, name: 'grams' }) });
  const heldTo = Array.isArray(reviews) ? reviewFor(reviews, today) : undefined;
  const line =
    Array.isArray(found) && heldTo && typed.success
      ? overLine(
          totalsOf(found).calories,
          weighedEntry(food, typed.data.grams, today).calories,
          heldTo.budgetKcal,
        )
      : undefined;
  return (
    // The bar holds one line, so it says what the form does, and the page names the food whole.
    <FormPage
      title="Log entry"
      onCancel={leave}
      fault={errors.root?.message}
      line={
        line && heldTo ? (
          <View className="flex-row items-center gap-grid-1">
            <View
              className={`h-3 w-3 rounded-full ${line.standing === 'over budget' ? 'bg-over' : 'bg-slightly-over'}`}
            />
            <Text
              className={`flex-1 font-language-bold text-body ${line.standing === 'over budget' ? 'text-over' : 'text-slightly-over'}`}
            >
              {`This puts you about ${kcal(line.overKcal)} over your ${kcal(heldTo.budgetKcal)} budget.`}
            </Text>
          </View>
        ) : undefined
      }
      action="Log entry"
      onAction={log}
    >
      <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
        {shownName(food.name)}
      </Text>
      <FormField
        control={control}
        name="grams"
        label="Weight (g)"
        keyboardType="decimal-pad"
        autoFocus
      />
    </FormPage>
  );
}

export default function LogFood() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { foods, readAgain } = useFoods();
  const food = Array.isArray(foods) ? foods.find((kept) => String(kept.id) === id) : undefined;
  // A link can put another food on this page, and what was typed is not of it.
  if (food) return <GramsForm key={food.id} food={food} />;
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-ground">
      <FormHeader title="Log entry" onCancel={() => router.dismissTo('/log')} />
      {/* iOS's bar is glass over the sheet, and what stands under it is hidden unless inset for it
          (the user's word, 27 November 2026, recorded on #87). */}
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="px-page">
        {foods === 'unreadable' ? <FoodsNotice foods={foods} readAgain={readAgain} /> : null}
        {Array.isArray(foods) ? (
          <Text className="font-language text-body text-ink">This food is not in your foods</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
