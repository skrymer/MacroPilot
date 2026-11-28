import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { kg, spokenKg } from '@/components/figures';
import { formFault } from '@/components/formFault';
import { FormField } from '@/components/FormField';
import { FormPage } from '@/components/FormPage';
import { goalForm } from '@/components/goalForm';
import { Text } from '@/components/Text';
import { useFirstFault } from '@/components/useFirstFault';
import { useSave } from '@/components/useSave';
import { newGoal } from '@/domain/goal';
import { reviewFor } from '@/domain/review';
import { trendWeight } from '@/domain/trend';
import { useToday } from '@/lifecycle/useToday';
import { useGoalStore } from '@/storage/GoalStoreContext';
import { useReviews } from '@/storage/useReviews';
import { useWeighIns } from '@/storage/useWeighIns';

/** The goal form's fields, in the order a fault among them is shown. */
const FIELDS = ['targetKg', 'rateKgPerWeek'] as const;

/** The form, from the Trend Weight a Goal starts at. */
function GoalForm({ trendKg, maintenanceKcal }: { trendKg: number; maintenanceKcal: number }) {
  const router = useRouter();
  const goals = useGoalStore();
  const today = useToday();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitted },
  } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(goalForm()),
    defaultValues: { targetKg: '', rateKgPerWeek: '' },
  });
  const leave = () => router.dismissTo('/profile');
  const { scroll, onLayoutOf, show } = useFirstFault(FIELDS);
  const save = useSave({
    form: { handleSubmit, setError },
    write: async (said) => {
      await goals.save(newGoal(said, { trendKg, maintenanceKcal }, today));
    },
    failed: 'Could not set goal. What you typed is still here.',
    leave,
    onRefused: show,
  });
  return (
    <FormPage
      title="Set a goal"
      onCancel={leave}
      fault={formFault({ errors, isSubmitted })}
      action="Set goal"
      onAction={save}
      scroll={scroll}
    >
      {/* Shown and never typed: a Goal starts from the trend when it is set. */}
      <View accessible accessibilityLabel={`Starting weight, ${spokenKg(trendKg)}`}>
        <Text className="font-language text-label text-ink-mid">Starting weight</Text>
        <Text className="font-weighed text-body text-ink">{kg(trendKg)}</Text>
        <Text className="font-language text-label text-ink-mid">
          your trend, smoothed from recent weigh-ins
        </Text>
      </View>
      <View onLayout={onLayoutOf('targetKg')}>
        <FormField
          control={control}
          name="targetKg"
          label="Target weight (kg)"
          keyboardType="decimal-pad"
        />
      </View>
      <View onLayout={onLayoutOf('rateKgPerWeek')}>
        <FormField
          control={control}
          name="rateKgPerWeek"
          label="Rate (kg a week)"
          keyboardType="decimal-pad"
        />
      </View>
    </FormPage>
  );
}

/** The goal form: a target weight and a rate, from the Trend Weight. */
export default function Goal() {
  const today = useToday();
  const { weighIns } = useWeighIns();
  const { reviews } = useReviews();
  if (!Array.isArray(weighIns) || !Array.isArray(reviews)) return null;
  const trendKg = trendWeight(weighIns);
  // The maintenance today is held to: a Goal is refused when its deficit would reach it.
  const heldTo = reviewFor(reviews, today);
  return trendKg === undefined || heldTo === undefined ? null : (
    <GoalForm trendKg={trendKg} maintenanceKcal={heldTo.maintenanceKcal} />
  );
}
