import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { DateField } from '@/components/DateField';
import { detailsForm } from '@/components/detailsForm';
import { formFault } from '@/components/formFault';
import { FormField } from '@/components/FormField';
import { FormPage } from '@/components/FormPage';
import { Segments } from '@/components/Segments';
import { useSave } from '@/components/useSave';
import { newProfile } from '@/domain/profile';
import { useToday } from '@/lifecycle/useToday';
import { useProfileStore } from '@/storage/ProfileStoreContext';

const SEXES = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
] as const;

/** Where the picker stands before a birth date is chosen: thirty years before today. */
const startsOn = (today: string) => `${Number(today.slice(0, 4)) - 30}${today.slice(4)}`;

export default function Details() {
  const store = useProfileStore();
  const router = useRouter();
  const today = useToday();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitted },
  } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(detailsForm(today)),
    defaultValues: { sex: undefined, born: '', heightCm: '', countsCalories: true },
  });
  const leave = () => router.dismissTo('/profile');
  const save = useSave({
    form: { handleSubmit, setError },
    write: (said) => store.save(newProfile(said, today)),
    failed: 'Could not save your details. What you gave is still here.',
    leave,
  });
  return (
    <FormPage
      title="Add your details"
      onCancel={leave}
      fault={formFault({ errors, isSubmitted })}
      action="Save profile"
      onAction={save}
    >
      <Controller
        control={control}
        name="sex"
        render={({ field, fieldState }) => (
          <Segments
            label="Sex"
            options={SEXES}
            value={field.value}
            onChange={field.onChange}
            fault={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="born"
        render={({ field, fieldState }) => (
          <DateField
            label="Birth date"
            value={field.value}
            onChange={field.onChange}
            starts={startsOn(today)}
            fault={fieldState.error?.message}
          />
        )}
      />
      <FormField control={control} name="heightCm" label="Height (cm)" keyboardType="decimal-pad" />
    </FormPage>
  );
}
