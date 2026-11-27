import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/FormField';
import { FormHeader } from '@/components/FormHeader';
import { FormPage } from '@/components/FormPage';
import { Unreadable } from '@/components/Unreadable';
import { useSave } from '@/components/useSave';
import { weightForm } from '@/components/weightForm';
import { newWeighIn, weighInOn } from '@/domain/weighIn';
import { useToday } from '@/lifecycle/useToday';
import { useWeighIns } from '@/storage/useWeighIns';
import { useWeighInStore } from '@/storage/WeighInStoreContext';

/** The form, given today's weight if there is one, to be replaced. */
function WeightForm({ today, kg }: { today: string; kg?: number }) {
  const store = useWeighInStore();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(weightForm),
    defaultValues: { kg: kg === undefined ? '' : String(kg) },
  });
  const leave = () => router.dismissTo('/');
  const save = useSave({
    form: { handleSubmit, setError },
    write: (said) => store.save(newWeighIn({ day: today, kg: said.kg }, today)),
    failed: 'Could not save weight. What you typed is still here.',
    leave,
  });
  return (
    <FormPage
      title="Log weight"
      onCancel={leave}
      fault={errors.root?.message}
      action="Save weight"
      onAction={save}
    >
      <FormField
        control={control}
        name="kg"
        label="Weight (kg)"
        keyboardType="decimal-pad"
        autoFocus
      />
    </FormPage>
  );
}

export default function LogWeight() {
  const router = useRouter();
  // The day the form was opened on: one left open past midnight is still that day's.
  const [today] = useState(useToday());
  const { weighIns, readAgain } = useWeighIns();
  if (weighIns === 'unreadable') {
    return (
      <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-ground">
        <FormHeader title="Log weight" onCancel={() => router.dismissTo('/')} />
        {/* iOS's bar is glass over the sheet, and what stands under it is hidden unless inset for it. */}
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="p-page">
          <Unreadable words="Couldn’t load your weight" onRetry={() => void readAgain()} />
        </ScrollView>
      </SafeAreaView>
    );
  }
  // Nothing before the first read, which is quick (DESIGN.md, *Asking and telling*).
  if (weighIns === 'unread') return null;
  return <WeightForm today={today} kg={weighInOn(weighIns, today)?.kg} />;
}
