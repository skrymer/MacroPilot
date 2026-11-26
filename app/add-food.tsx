import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { grams } from '@/components/figures';
import { foodForm, foodOf } from '@/components/foodForm';
import { formFault } from '@/components/formFault';
import { FormField } from '@/components/FormField';
import { FormPage } from '@/components/FormPage';
import { useDiscard } from '@/components/useDiscard';
import { useFirstFault } from '@/components/useFirstFault';
import { useSave } from '@/components/useSave';
import { useFoodStore } from '@/storage/FoodStoreContext';

const FIELDS = [
  ['name', 'Name'],
  ['protein', `Protein per ${grams(100)}`],
  ['carbohydrate', `Carbohydrate per ${grams(100)}`],
  ['fat', `Fat per ${grams(100)}`],
  ['fibre', `Fibre per ${grams(100)}, optional`],
  ['abv', 'Alcohol % volume, optional'],
] as const;

export default function AddFood() {
  const store = useFoodStore();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(foodForm),
    defaultValues: { name: '', protein: '', carbohydrate: '', fat: '', fibre: '', abv: '' },
  });
  // What is being saved is not there to be discarded.
  const letGo = useDiscard(isDirty && !isSubmitting, 'Discard this food?');
  const leave = () => router.dismissTo('/foods');
  const { scroll, onLayoutOf, show } = useFirstFault(FIELDS.map(([name]) => name));
  const save = useSave({
    form: { handleSubmit, setError },
    write: (said) => store.add(foodOf(said)),
    failed: 'Could not add food. What you typed is still here.',
    leave: () => {
      letGo();
      leave();
    },
    onRefused: show,
  });

  return (
    <FormPage
      title="Add food"
      onCancel={leave}
      fault={formFault(errors)}
      action="Save food"
      onAction={save}
      scroll={scroll}
    >
      {FIELDS.map(([name, label]) => (
        <View key={name} onLayout={onLayoutOf(name)}>
          <FormField
            control={control}
            name={name}
            label={label}
            keyboardType={name === 'name' ? undefined : 'decimal-pad'}
          />
        </View>
      ))}
    </FormPage>
  );
}
