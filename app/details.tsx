import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import type { z } from 'zod';

import { DateField } from '@/components/DateField';
import { detailsForm } from '@/components/detailsForm';
import { formFault } from '@/components/formFault';
import { FormField } from '@/components/FormField';
import { FormHeader } from '@/components/FormHeader';
import { FormPage } from '@/components/FormPage';
import { SEXES, TRACKING } from '@/components/profileWords';
import { Segments } from '@/components/Segments';
import { useDiscard } from '@/components/useDiscard';
import { useFirstFault } from '@/components/useFirstFault';
import { Unreadable } from '@/components/Unreadable';
import { useSave } from '@/components/useSave';
import { yearsBefore } from '@/domain/day';
import { MAX_AGE_YEARS, newProfile, type Profile } from '@/domain/profile';
import { useToday } from '@/lifecycle/useToday';
import { useProfileStore } from '@/storage/ProfileStoreContext';
import { useProfile } from '@/storage/useProfile';

type Typed = z.input<ReturnType<typeof detailsForm>>;

/** From the top: the ones that can be at fault. */
const FIELDS = ['sex', 'born', 'heightCm'] as const;

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
  const { scroll, onLayoutOf, show } = useFirstFault(FIELDS);
  const save = useSave({
    form: { handleSubmit, setError },
    write: (said) => store.save(newProfile(said, today)),
    failed: 'Could not save profile. What you gave is still here.',
    leave: () => {
      letGo();
      leave();
    },
    onRefused: show,
  });
  return (
    <FormPage
      title={saved ? 'Change details' : 'Add your details'}
      onCancel={leave}
      fault={formFault({ errors, isSubmitted })}
      action="Save profile"
      onAction={save}
      scroll={scroll}
    >
      <View onLayout={onLayoutOf('sex')}>
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
      </View>
      <View onLayout={onLayoutOf('born')}>
        <Controller
          control={control}
          name="born"
          render={({ field, fieldState }) => (
            <DateField
              label="Birth date"
              value={field.value}
              onChange={field.onChange}
              // Where the picker stands before a birth date is chosen.
              starts={yearsBefore(today, 30)}
              earliest={yearsBefore(today, MAX_AGE_YEARS)}
              before={today}
              fault={fieldState.error?.message}
            />
          )}
        />
      </View>
      <View onLayout={onLayoutOf('heightCm')}>
        <FormField
          control={control}
          name="heightCm"
          label="Height (cm)"
          keyboardType="decimal-pad"
        />
      </View>
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
  const router = useRouter();
  const { profile, readAgain } = useProfile();
  if (profile === 'unreadable') {
    return (
      <View className="flex-1 bg-ground p-page">
        <FormHeader title="Your details" onCancel={() => router.dismissTo('/profile')} />
        <Unreadable words="Couldn’t load your profile" onRetry={() => void readAgain()} />
      </View>
    );
  }
  // Nothing before the first read, which is quick (DESIGN.md, *Asking and telling*).
  if (profile === 'unread') return null;
  return <DetailsForm saved={profile[0]} />;
}
