// THROWAWAY: the grams page's live line when an entry would pass the budget (epic 2). See NOTES.md.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { FormHeader } from '@/components/FormHeader';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';

// The floating bar, copied from the retired today-targets prototype: both are throwaway.
export type Chip<T extends string> = { label: string; value: T };

/** The prototype's switches: a row of chips, the chosen one filled. */
export function Chips<T extends string>({
  chips,
  chosen,
  onChoose,
}: {
  chips: Chip<T>[];
  chosen: T;
  onChoose: (value: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-1">
      {chips.map(({ label, value }) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          accessibilityState={{ selected: chosen === value }}
          onPress={() => onChoose(value)}
          className={`min-h-target min-w-target items-center justify-center rounded-full border border-ink px-3 ${
            chosen === value ? 'bg-ink' : ''
          }`}
        >
          <Text
            className={`font-language-bold text-label ${chosen === value ? 'text-ground' : 'text-ink'}`}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** The floating bar: what is being judged, and a way to hide it for a clean photo. */
export function Bar({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(true);
  return shown ? (
    <View className="gap-1 rounded-2xl border border-line bg-surface p-2">
      {children}
      <Chips
        chips={[{ label: 'Hide bar', value: 'hide' }]}
        chosen=""
        onChoose={() => setShown(false)}
      />
    </View>
  ) : (
    <View className="items-end">
      <Chips
        chips={[{ label: 'Show bar', value: 'show' }]}
        chosen=""
        onChoose={() => setShown(true)}
      />
    </View>
  );
}

// The ring, drawn as the design page's specimen draws it.

type Variant = 'A' | 'B';
type State = 'under' | 'slightly' | 'over';

const VARIANTS: Chip<Variant>[] = [
  { label: 'A words only', value: 'A' },
  { label: 'B words and a mark', value: 'B' },
];

const STATES: Chip<State>[] = [
  { label: 'Under budget', value: 'under' },
  { label: 'Slightly over', value: 'slightly' },
  { label: 'Over the tolerance', value: 'over' },
];

/** The grams each state starts with; typing changes the line as it would on the page. */
const GRAMS: Record<State, string> = { under: '60', slightly: '120', over: '200' };

/** Rolled oats, 379 kcal per 100 g, on a day of 1520 kcal against a budget of 1840. */
const PER_GRAM = 3.79;
const SO_FAR = 1520;
const BUDGET = 1840;
const TOLERANCE = 0.1;

const nbsp = String.fromCharCode(0xa0);

export default function OverLine() {
  const router = useRouter();
  const { variant: asked } = useLocalSearchParams<{ variant?: string }>();
  const [variant, setVariant] = useState<Variant>(asked === 'B' ? 'B' : 'A');
  const [grams, setGrams] = useState(GRAMS.slightly);
  const [state, setState] = useState<State>('slightly');
  const typed = Number(grams.replace(',', '.'));
  const projected = SO_FAR + (Number.isFinite(typed) ? typed : 0) * PER_GRAM;
  const overBy = Math.round(projected - BUDGET);
  const pastTolerance = projected > BUDGET * (1 + TOLERANCE);
  const ink = pastTolerance ? 'text-over' : 'text-slightly-over';
  const mark = pastTolerance ? 'bg-over' : 'bg-slightly-over';
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-ground">
      <FormHeader title="Log entry" onCancel={() => router.back()} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-grid-2 p-page"
      >
        <Bar>
          <Chips chips={VARIANTS} chosen={variant} onChoose={setVariant} />
          <Chips
            chips={STATES}
            chosen={state}
            onChoose={(next) => {
              setState(next);
              setGrams(GRAMS[next]);
            }}
          />
        </Bar>
        <View className="gap-grid-2 rounded-card bg-surface p-grid-2">
          <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
            Rolled oats
          </Text>
          <View className="gap-1">
            <Text className="font-language text-label text-ink-mid">Weight (g)</Text>
            <Input
              accessibilityLabel="Weight (g)"
              value={grams}
              onChangeText={setGrams}
              keyboardType="decimal-pad"
              className="border border-edge bg-surface-lift font-language text-body"
            />
          </View>
        </View>
      </ScrollView>
      <View className="gap-grid-1 px-page py-grid-1">
        {overBy > 0 ? (
          <View className="flex-row items-center gap-grid-1">
            {variant === 'B' ? <View className={`h-3 w-3 rounded-full ${mark}`} /> : null}
            <Text className={`flex-1 font-language-bold text-body ${ink}`}>
              {`This puts you about ${overBy}${nbsp}kcal over your ${BUDGET}${nbsp}kcal budget.`}
            </Text>
          </View>
        ) : null}
        <Button label="Log entry" onPress={() => undefined} />
      </View>
    </SafeAreaView>
  );
}
