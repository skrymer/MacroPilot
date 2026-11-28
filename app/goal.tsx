import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { kg, spokenKg } from '@/components/figures';
import { formFault } from '@/components/formFault';
import { FormField } from '@/components/FormField';
import { FormHeader } from '@/components/FormHeader';
import { FormPage } from '@/components/FormPage';
import { goalForm } from '@/components/goalForm';
import { Text } from '@/components/Text';
import { Unreadable } from '@/components/Unreadable';
import { useFirstFault } from '@/components/useFirstFault';
import { useRunReview } from '@/components/useRunReview';
import { useSave } from '@/components/useSave';
import { type Goal, newGoal } from '@/domain/goal';
import { reviewFor } from '@/domain/review';
import { trendWeight } from '@/domain/trend';
import { useToday } from '@/lifecycle/useToday';
import { useGoalStore } from '@/storage/GoalStoreContext';
import { useGoal } from '@/storage/useGoal';
import { useReviews } from '@/storage/useReviews';
import { useWeighIns } from '@/storage/useWeighIns';

/** The goal form's fields, in the order a fault among them is shown. */
const FIELDS = ['targetKg', 'rateKgPerWeek'] as const;

/** The form, from the Trend Weight a Goal starts at. */
function GoalForm({
  trendKg,
  maintenanceKcal,
  set,
}: {
  trendKg: number;
  maintenanceKcal: number;
  set?: Goal;
}) {
  const router = useRouter();
  const goals = useGoalStore();
  const runReview = useRunReview();
  const today = useToday();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitted },
  } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(goalForm({ trendKg, maintenanceKcal })),
    // The Goal set before, to be changed, or none.
    defaultValues: set
      ? { targetKg: String(set.targetKg), rateKgPerWeek: String(set.rateKgPerWeek) }
      : { targetKg: '', rateKgPerWeek: '' },
  });
  const leave = () => router.dismissTo('/profile');
  const { scroll, onLayoutOf, show } = useFirstFault(FIELDS);
  const save = useSave({
    form: { handleSubmit, setError },
    write: async (said) => {
      await goals.save(newGoal(said, { trendKg, maintenanceKcal }, today));
      await runReview(today, false, true);
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

/** In place of the form, under its header: why there is no form to fill. */
function InPlaceOfTheForm({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <View className="flex-1 bg-ground p-page">
      <FormHeader title="Set a goal" onCancel={() => router.dismissTo('/profile')} />
      {children}
    </View>
  );
}

/** The goal form: a target weight and a rate, from the Trend Weight. */
export default function GoalPage() {
  const today = useToday();
  const { weighIns, readAgain: readWeighInsAgain } = useWeighIns();
  const { reviews, readAgain: readReviewsAgain } = useReviews();
  const { goal, readAgain } = useGoal();
  if (goal === 'unreadable' || weighIns === 'unreadable' || reviews === 'unreadable') {
    const retry = () => {
      void readAgain();
      void readWeighInsAgain();
      void readReviewsAgain();
    };
    return (
      <InPlaceOfTheForm>
        <Unreadable words="Couldn’t load your goal" onRetry={retry} />
      </InPlaceOfTheForm>
    );
  }
  if (!Array.isArray(weighIns) || !Array.isArray(reviews) || !Array.isArray(goal)) return null;
  const trendKg = trendWeight(weighIns);
  // The maintenance today is held to: a Goal is refused when its deficit would reach it.
  const heldTo = reviewFor(reviews, today);
  if (trendKg === undefined || heldTo === undefined) {
    return (
      <InPlaceOfTheForm>
        <Text className="font-language text-body text-ink-mid">
          Save your details and log your weight on Today to set a goal.
        </Text>
      </InPlaceOfTheForm>
    );
  }
  return <GoalForm trendKg={trendKg} maintenanceKcal={heldTo.maintenanceKcal} set={goal[0]} />;
}
