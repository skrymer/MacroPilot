import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';

import { DateField } from '@/components/DateField';
import { detailsForm } from '@/components/detailsForm';
import { formFault } from '@/components/formFault';
import { FormField } from '@/components/FormField';
import { FormPage } from '@/components/FormPage';
import { Segments } from '@/components/Segments';
import { useDiscard } from '@/components/useDiscard';
import { useSave } from '@/components/useSave';
import { newProfile, type Profile } from '@/domain/profile';
import { useToday } from '@/lifecycle/useToday';
import { useProfileStore } from '@/storage/ProfileStoreContext';
import { useProfile } from '@/storage/useProfile';

const SEXES = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
] as const;

/** Two named answers rather than a switch: off is a way of using the app, not a setting turned down. */
const TRACKING = [
  { label: 'Calories and weight', value: true },
  { label: 'Weight only', value: false },
] as const;

type Typed = z.input<ReturnType<typeof detailsForm>>;

/** Where the picker stands before a birth date is chosen: thirty years before today. */
const startsOn = (today: string) => `${Number(today.slice(0, 4)) - 30}${today.slice(4)}`;

/** The form, given the details saved before, to be changed, or none. */
function DetailsForm({ saved }: { saved?: Profile }) {
  const store = useProfileStore();
  const router = useRouter();
  const today = useToday();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting, isSubmitted },
  } = useForm<Typed, unknown, Profile>({
    mode: 'onTouched',
    resolver: zodResolver(detailsForm(today)),
    // Calorie tracking is on unless the user says otherwise.
    defaultValues: saved
      ? { ...saved, heightCm: String(saved.heightCm) }
      : { sex: undefined, born: '', heightCm: '', countsCalories: true },
  });
  // What is being saved is not there to be discarded.
  const letGo = useDiscard(isDirty && !isSubmitting, 'Discard these changes?');
  const leave = () => router.dismissTo('/profile');
  const save = useSave({
    form: { handleSubmit, setError },
    write: (said) => store.save(newProfile(said, today)),
    failed: 'Could not save your details. What you gave is still here.',
    leave: () => {
      letGo();
      leave();
    },
  });
  return (
    <FormPage
      title={saved ? 'Change details' : 'Add your details'}
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
      <Controller
        control={control}
        name="countsCalories"
        render={({ field }) => (
          <Segments
            label="Calorie tracking"
            options={TRACKING}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
    </FormPage>
  );
}

export default function Details() {
  const { profile } = useProfile();
  // Nothing before the first read, which is quick (DESIGN.md, *Asking and telling*).
  if (!Array.isArray(profile)) return null;
  return <DetailsForm saved={profile[0]} />;
}
