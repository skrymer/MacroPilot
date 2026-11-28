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
import { trendWeight } from '@/domain/trend';
import { useWeighIns } from '@/storage/useWeighIns';

/** The goal form's fields, in the order a fault among them is shown. */
const FIELDS = ['targetKg', 'rateKgPerWeek'] as const;

/** The form, from the Trend Weight a Goal starts at. */
function GoalForm({ trendKg }: { trendKg: number }) {
  const router = useRouter();
  const {
    control,
    formState: { errors, isSubmitted },
  } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(goalForm()),
    defaultValues: { targetKg: '', rateKgPerWeek: '' },
  });
  const leave = () => router.dismissTo('/profile');
  const { scroll, onLayoutOf } = useFirstFault(FIELDS);
  return (
    <FormPage
      title="Set a goal"
      onCancel={leave}
      fault={formFault({ errors, isSubmitted })}
      action="Set goal"
      onAction={() => undefined}
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
  const { weighIns } = useWeighIns();
  if (!Array.isArray(weighIns)) return null;
  const trendKg = trendWeight(weighIns);
  return trendKg === undefined ? null : <GoalForm trendKg={trendKg} />;
}
