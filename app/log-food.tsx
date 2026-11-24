import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
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
  const navigation = useNavigation();
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
  const log = useSave(async () => {
    let saved = false;
    await handleSubmit(async ({ grams }) => {
      // The day is the phone's when it is saved, not when the sheet was opened.
      const now = clock.now();
      const entry = weighedEntry(food, grams, dayOf(now, clock.utcOffsetMinutes(now)));
      try {
        await store.add(entry);
      } catch {
        setError('root', { message: 'Not logged. What you typed is still here.' });
        return;
      }
      saved = true;
      setLogged({ name: food.name, entry });
      // The user may have left while it was written, and is not taken from where they went.
      if (navigation.isFocused()) router.dismissTo('/log');
    })();
    return saved;
  });
  return (
    <SafeAreaView className="gap-4 bg-surface p-4" edges={['bottom']}>
      <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
        {shownName(food.name)}
      </Text>
      <FormField control={control} name="grams" label="Grams" keyboardType="decimal-pad" />
      {errors.root ? (
        <Text accessibilityRole="alert" className="font-language-bold text-body text-ink">
          {errors.root.message}
        </Text>
      ) : null}
      <Button label="Log entry" onPress={() => void log()} />
    </SafeAreaView>
  );
}

export default function LogFood() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { foods } = useFoods();
  const food = Array.isArray(foods) ? foods.find((kept) => String(kept.id) === id) : undefined;
  return food ? <GramsForm food={food} /> : null;
}
