import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';

import { FormField } from '@/components/FormField';
import { FormPage } from '@/components/FormPage';
import { useSave } from '@/components/useSave';
import { weightForm } from '@/components/weightForm';
import { newWeighIn } from '@/domain/weighIn';
import { useToday } from '@/lifecycle/useToday';
import { useWeighInStore } from '@/storage/WeighInStoreContext';

export default function LogWeight() {
  const store = useWeighInStore();
  const router = useRouter();
  const today = useToday();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(weightForm),
    defaultValues: { kg: '' },
  });
  const leave = () => router.dismissTo('/');
  const save = useSave({
    form: { handleSubmit, setError },
    write: ({ kg }) => store.save(newWeighIn({ day: today, kg }, today)),
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
