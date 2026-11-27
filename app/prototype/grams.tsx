// THROWAWAY: the grams page's title, B (#87). See app/prototype/NOTES.md.
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { FormPage } from '@/components/FormPage';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';

const NAME = 'Greek yoghurt with honey, walnuts and a little cinnamon, 10% fat';

/** B: a fixed title in the bar, and the food's whole name as the page's first line. */
export default function GramsTitlePrototype() {
  const router = useRouter();
  return (
    <FormPage
      title="Log entry"
      onCancel={() => router.back()}
      action="Log entry"
      onAction={() => {}}
    >
      <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
        {NAME}
      </Text>
      <View className="gap-1">
        <Text className="font-language text-label text-ink-mid">Weight (g)</Text>
        <Input
          accessibilityLabel="Weight (g)"
          keyboardType="decimal-pad"
          autoFocus
          className="border border-edge bg-surface-lift font-language text-body"
        />
      </View>
    </FormPage>
  );
}
