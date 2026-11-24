import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CancelButton } from '@/components/CancelButton';
import { FoodsNotice } from '@/components/FoodsNotice';
import { FormField } from '@/components/FormField';
import { FormPage } from '@/components/FormPage';
import { gramsForm } from '@/components/gramsForm';
import { useLogged } from '@/components/LoggedContext';
import { Text } from '@/components/Text';
import { useSave } from '@/components/useSave';
import { dayOf } from '@/domain/day';
import { weighedEntry } from '@/domain/entry';
import type { Food } from '@/domain/food';
import { shownName } from '@/domain/shownName';
import { useClock } from '@/lifecycle/ClockContext';
import { useEntryStore } from '@/storage/EntryStoreContext';
import { useFoods } from '@/storage/useFoods';

function GramsForm({ food }: { food: Food }) {
  const router = useRouter();
  const clock = useClock();
  const store = useEntryStore();
  const [, setLogged] = useLogged();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(gramsForm),
    defaultValues: { grams: '' },
  });
  const leave = () => router.dismissTo('/log');
  const log = useSave({
    form: { handleSubmit, setError },
    write: async ({ grams }) => {
      // The day is the phone's when it is saved, not when the form was opened.
      const now = clock.now();
      const entry = weighedEntry(food, grams, dayOf(now, clock.utcOffsetMinutes(now)));
      await store.add(entry);
      setLogged({ name: food.name, entry });
    },
    failed: 'Not logged. What you typed is still here.',
    leave,
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
