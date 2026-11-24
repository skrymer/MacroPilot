import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';

/**
 * The living design reference. Every token and treatment in DESIGN.md renders here; if the two
 * disagree, this page is wrong. Today it shows the placeholder tokens the scaffold runs on.
 */

const COLOURS = [
  ['ground', 'bg-ground'],
  ['surface', 'bg-surface'],
  ['surface-lift', 'bg-surface-lift'],
  ['line', 'bg-line'],
] as const;

const Heading = ({ children }: { children: string }) => (
  <Text accessibilityRole="header" className="mb-2 mt-8 text-eyebrow text-ink-dim">
    {children}
  </Text>
);

export default function Design() {
  return (
    <SafeAreaView className="flex-1 bg-ground">
      <ScrollView contentContainerClassName="px-4 pb-12">
        <Heading>Type</Heading>
        <Text className="text-figure-lg text-ink">1840</Text>
        <Text className="text-figure text-ink">
          132<Text className="text-unit text-ink-mid"> g</Text>
        </Text>
        <Text className="text-title text-ink">Title</Text>
        <Text className="text-body text-ink">Body</Text>
        <Text className="text-label text-ink-mid">Label</Text>
        <Text className="text-body italic text-ink-dim">not logged</Text>

        <Heading>Grounds</Heading>
        {COLOURS.map(([name, background]) => (
          <View key={name} className={`mb-2 rounded-2xl border border-line p-4 ${background}`}>
            <Text className="text-label text-ink">{name}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
