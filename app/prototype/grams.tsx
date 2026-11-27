// THROWAWAY: the grams page's title, B (#87). See app/prototype/NOTES.md.
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { FormHeader } from '@/components/FormHeader';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';

const NAME = 'Greek yoghurt with honey, walnuts and a little cinnamon, 10% fat';

/** B: a fixed title in the bar, and the food's whole name as the page's first line. */
export default function GramsTitlePrototype() {
  const router = useRouter();
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-ground">
      <FormHeader title="Log entry" onCancel={() => router.back()} />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView contentContainerClassName="gap-grid-2 px-page py-grid-2">
          <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
            {NAME}
          </Text>
          <View className="gap-1">
            <Text className="font-language text-label text-ink-mid">Weight (g)</Text>
            <Input accessibilityLabel="Weight (g)" keyboardType="decimal-pad" autoFocus />
          </View>
        </ScrollView>
        <View className="px-page py-grid-1">
          <Button label="Log entry" onPress={() => {}} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
