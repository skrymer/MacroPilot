import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';

import { FormField } from '@/components/FormField';
import { FormPage } from '@/components/FormPage';
import { useSave } from '@/components/useSave';
import { weightForm } from '@/components/weightForm';
import { newWeighIn } from '@/domain/weighIn';
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
  const today = useToday();
  const { weighIns } = useWeighIns();
  // Nothing before the first read, which is quick (DESIGN.md, *Asking and telling*).
  if (!Array.isArray(weighIns)) return null;
  const weighedToday = weighIns.find((weighIn) => weighIn.day === today);
  return <WeightForm today={today} kg={weighedToday?.kg} />;
}
