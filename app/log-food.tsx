import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FoodsNotice } from '@/components/FoodsNotice';
import { FormField } from '@/components/FormField';
import { FormHeader } from '@/components/FormHeader';
import { FormPage } from '@/components/FormPage';
import { gramsForm } from '@/components/gramsForm';
import { OverLine } from '@/components/OverLine';
import { Text } from '@/components/Text';
import { useLogEntry } from '@/components/useLogEntry';
import { useOverLine } from '@/components/useOverLine';
import { weighedEntry } from '@/domain/entry';
import type { Food } from '@/domain/food';
import { shownName } from '@/domain/shownName';
import { useFoods } from '@/storage/useFoods';

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
  const typed = gramsForm.safeParse({ grams: useWatch({ control, name: 'grams' }) });
  const line = useOverLine((day) =>
    typed.success ? weighedEntry(food, typed.data.grams, day).calories : undefined,
  );
  return (
    // The bar holds one line, so it says what the form does, and the page names the food whole.
    <FormPage
      title="Log entry"
      onCancel={leave}
      fault={errors.root?.message}
      line={line ? <OverLine {...line} /> : undefined}
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
