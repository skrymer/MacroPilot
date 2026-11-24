import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRouter } from 'expo-router';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { foodForm } from '@/components/foodForm';
import { FormField } from '@/components/FormField';
import { Text } from '@/components/Text';
import { useFoodStore } from '@/storage/FoodStoreContext';

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
    defaultValues: { name: '', protein: '', carbohydrate: '', fat: '' },
  });
  const leave = () => router.dismissTo('/foods');
  // Held through a save that worked, since the page can still be pressed while it goes.
  const saving = useRef(false);
  const save = async () => {
    if (saving.current) return;
    saving.current = true;
    let saved = false;
    await handleSubmit(async ({ name, ...macros }) => {
      try {
        await store.add({ name, macros });
      } catch {
        setError('root', { message: 'Not saved. What you typed is still here.' });
        return;
      }
      saved = true;
      // The user may have left while it was written, and is not taken from where they went.
      if (navigation.isFocused()) leave();
    })();
    saving.current = saved;
  };

  return (
    <SafeAreaView className="flex-1 bg-ground">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 px-4 pb-4">
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
          <FormField control={control} name="name" label="Name" />
          <FormField
            control={control}
            name="protein"
            label={'Protein per 100 g'}
            keyboardType="decimal-pad"
          />
          <FormField
            control={control}
            name="carbohydrate"
            label={'Carbohydrate per 100 g'}
            keyboardType="decimal-pad"
          />
          <FormField
            control={control}
            name="fat"
            label={'Fat per 100 g'}
            keyboardType="decimal-pad"
          />
          {errors.root ? (
            <Text accessibilityRole="alert" className="font-language-bold text-body text-ink">
              {errors.root.message}
            </Text>
          ) : null}
          <Button label="Save food" onPress={() => void save()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
