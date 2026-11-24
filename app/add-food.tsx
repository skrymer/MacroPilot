import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { useForm } from 'react-hook-form';
import { View, type ScrollView } from 'react-native';

import { foodForm, foodOf } from '@/components/foodForm';
import { FormField } from '@/components/FormField';
import { FormPage } from '@/components/FormPage';
import { useSave } from '@/components/useSave';
import { useFoodStore } from '@/storage/FoodStoreContext';

const FIELDS = [
  ['name', 'Name'],
  ['protein', 'Protein per 100 g'],
  ['carbohydrate', 'Carbohydrate per 100 g'],
  ['fat', 'Fat per 100 g'],
  ['fibre', 'Fibre per 100 g, optional'],
  ['abv', 'Alcohol % volume, optional'],
] as const;

export default function AddFood() {
  const store = useFoodStore();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(foodForm),
    defaultValues: { name: '', protein: '', carbohydrate: '', fat: '', fibre: '', abv: '' },
  });
  const leave = () => router.dismissTo('/foods');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const tops = useRef<Record<string, number>>({});
  // The system keeps the focused field in view, and not the label and the fault above it.
  const showFirstFault = (faults: object) => {
    const first = FIELDS.find(([name]) => name in faults);
    // At once: one still moving is cut off by the system's own, to the field alone.
    if (first) scroll.current?.scrollTo({ y: tops.current[first[0]], animated: false });
  };
  const save = useSave({
    form: { handleSubmit, setError },
    write: (said) => store.add(foodOf(said)),
    failed: 'Could not add food. What you typed is still here.',
    leave,
    onRefused: showFirstFault,
  });
  // Beside the field as well, where it can be out of view.
  const refused = Object.keys(errors).some((name) => name !== 'root');
  const notSaved = refused ? 'Not saved. A field above needs changing.' : errors.root?.message;

  return (
    <FormPage
      title="Add food"
      onCancel={leave}
      fault={notSaved}
      action="Save food"
      onAction={save}
      scroll={scroll}
    >
      {FIELDS.map(([name, label]) => (
        <View
          key={name}
          onLayout={({ nativeEvent }) => {
            tops.current[name] = nativeEvent.layout.y;
          }}
        >
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
