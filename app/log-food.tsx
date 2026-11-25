import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CancelButton } from '@/components/CancelButton';
import { FoodsNotice } from '@/components/FoodsNotice';
import { FormField } from '@/components/FormField';
import { FormPage } from '@/components/FormPage';
import { gramsForm } from '@/components/gramsForm';
import { Text } from '@/components/Text';
import { useLogEntry } from '@/components/useLogEntry';
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
    resolver: zodResolver(gramsForm),
    defaultValues: { grams: '' },
  });
  const { log, leave } = useLogEntry({
    form: { handleSubmit, setError },
    entryOn: ({ grams }, day) => ({ name: food.name, entry: weighedEntry(food, grams, day) }),
  });
  return (
    <FormPage
      title={`Log ${shownName(food.name)}`}
      onCancel={leave}
      fault={errors.root?.message}
      action="Log entry"
      onAction={log}
    >
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
    <SafeAreaView className="flex-1 bg-ground px-4">
      <CancelButton onPress={() => router.dismissTo('/log')} />
      {foods === 'unreadable' ? <FoodsNotice foods={foods} readAgain={readAgain} /> : null}
      {Array.isArray(foods) ? (
        <Text className="font-language text-body text-ink">This food is not in your foods</Text>
      ) : null}
    </SafeAreaView>
  );
}
