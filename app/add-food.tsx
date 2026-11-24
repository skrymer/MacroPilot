import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRouter } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { foodForm, foodOf } from '@/components/foodForm';
import { FormField } from '@/components/FormField';
import { Text } from '@/components/Text';
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
  const navigation = useNavigation();
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
  const form = useRef<ComponentRef<typeof ScrollView>>(null);
  const tops = useRef<Record<string, number>>({});
  // The system keeps the focused field in view, and not the label and the fault above it.
  const showFirstFault = (faults: object) => {
    const first = FIELDS.find(([name]) => name in faults);
    if (first) form.current?.scrollTo({ y: tops.current[first[0]] });
  };
  // Held through a save that worked, since the page can still be pressed while it goes.
  const saving = useRef(false);
  const save = async () => {
    if (saving.current) return;
    saving.current = true;
    let saved = false;
    await handleSubmit(async (said) => {
      try {
        await store.add(foodOf(said));
      } catch {
        setError('root', { message: 'Not saved. What you typed is still here.' });
        return;
      }
      saved = true;
      // The user may have left while it was written, and is not taken from where they went.
      if (navigation.isFocused()) leave();
    }, showFirstFault)();
    saving.current = saved;
  };
  // Beside the field as well, where it can be out of view.
  const refused = Object.keys(errors).some((name) => name !== 'root');
  const notSaved = refused ? 'Not saved. A field above needs changing.' : errors.root?.message;

  return (
    <SafeAreaView className="flex-1 bg-ground">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          ref={form}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-4 px-4 pb-4"
        >
          <View className="items-start">
            <Pressable
              accessibilityRole="button"
              onPress={leave}
              className="min-h-target min-w-target items-center justify-center"
            >
              <Text className="font-language text-body text-ink">Cancel</Text>
            </Pressable>
            <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
              Add food
            </Text>
          </View>
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
        </ScrollView>
        {/* Out of the scroll view, so that the keyboard never hides them. */}
        <View className="gap-2 px-4 py-2">
          {notSaved ? (
            <Text accessibilityRole="alert" className="font-language-bold text-body text-ink">
              {notSaved}
            </Text>
          ) : null}
          <Button label="Save food" onPress={() => void save()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
