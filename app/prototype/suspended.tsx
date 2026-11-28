// THROWAWAY: how Today and Profile's goal card say the Goal's deficit is suspended (#168). See NOTES.md.
import { useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { DayRing } from '@/components/DayRing';
import { Text } from '@/components/Text';
import { useTint } from '@/components/useTint';

type Chip<T extends string> = { label: string; value: T };

/** The prototype's switches: a row of chips, the chosen one filled. */
function Chips<T extends string>({
  chips,
  chosen,
  onChoose,
}: {
  chips: Chip<T>[];
  chosen: T | '';
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
function Bar({ children }: { children: ReactNode }) {
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

type Variant = 'A' | 'B' | 'C';
type Page = 'today' | 'profile';

const VARIANTS: Chip<Variant>[] = [
  { label: 'A card above', value: 'A' },
  { label: 'B line in the ring card', value: 'B' },
  { label: 'C a row atop it', value: 'C' },
];
const PAGES: Chip<Page>[] = [
  { label: 'Today', value: 'today' },
  { label: 'Profile', value: 'profile' },
];

/**
 * A woman of 150 cm and 47 kg, maintenance 1535 kcal, with a Goal of 1.4 kg a week (1540 kcal a day):
 * the deficit is suspended, so the budget is the maintenance. 820 kcal and 61 g of protein logged.
 */
const MAINTENANCE = 1535;
const DEFICIT = 1540;
const LOGGED = 820;
const FLOOR = 94;
const PROTEIN = 61;
const nbsp = String.fromCharCode(0xa0);
const TITLE = 'No deficit is being applied';
const WORDS =
  'Your goal’s rate needs more of a daily deficit than your maintenance can give, so MacroPilot isn’t applying one. Your calorie budget below is your full maintenance — you’re holding steady, not losing.';

/** The pause sign, in ink-mid: a state of the targets, neither a fault nor a standing. */
function Pause({ size }: { size: number }) {
  const tint = useTint();
  return (
    <SymbolView
      name={{ ios: 'pause.circle', android: 'pause_circle' }}
      size={size}
      tintColor={tint['ink-mid']}
    />
  );
}

/** Today's ring card, as the day draws it: 715 kcal left of a budget of 1535. */
function RingCard({ children }: { children?: ReactNode }) {
  return (
    <View className="gap-grid-2 rounded-card bg-surface p-grid-2">
      {children}
      <View className="items-center">
        <DayRing share={LOGGED / MAINTENANCE} proteinShare={PROTEIN / FLOOR} standing="within">
          <Text className="font-weighed text-figure text-ink">{MAINTENANCE - LOGGED}</Text>
          <Text className="font-language text-label text-ink-mid">kcal left</Text>
        </DayRing>
        <Text className="mt-grid-1 text-center font-language-bold text-body text-ink">
          In progress
        </Text>
        <Text className="text-center font-language text-label text-ink-mid">
          {`${FLOOR - PROTEIN}${nbsp}g protein to go`}
        </Text>
      </View>
    </View>
  );
}

function Today({ variant }: { variant: Variant }) {
  if (variant === 'A') {
    return (
      <>
        <View className="items-center gap-grid-1 rounded-card bg-surface p-grid-2">
          <Pause size={32} />
          <Text className="text-center font-language-bold text-body text-ink">{TITLE}</Text>
          <Text className="text-center font-language text-label text-ink-mid">{WORDS}</Text>
          <Button label="Ease your goal" onPress={() => undefined} secondary />
        </View>
        <RingCard />
      </>
    );
  }
  if (variant === 'B') {
    return (
      <View className="gap-grid-2 rounded-card bg-surface p-grid-2">
        <RingCard />
        <View className="flex-row gap-grid-1">
          <Pause size={20} />
          <View className="flex-1 gap-1">
            <Text className="font-language-bold text-body text-ink">{TITLE}</Text>
            <Text className="font-language text-label text-ink-mid">{WORDS}</Text>
          </View>
        </View>
        <Button label="Ease your goal" onPress={() => undefined} secondary />
      </View>
    );
  }
  return (
    <RingCard>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${TITLE}. Ease your goal`}
        onPress={() => undefined}
        className="min-h-target min-w-target flex-row items-center gap-grid-1"
      >
        <Pause size={20} />
        <View className="flex-1">
          <Text className="font-language-bold text-body text-ink">{TITLE}</Text>
          <Text className="font-language text-label text-ink-mid">
            Your budget is your maintenance. Ease your goal ›
          </Text>
        </View>
      </Pressable>
    </RingCard>
  );
}

function Profile({ variant }: { variant: Variant }) {
  const said =
    variant === 'A'
      ? `1.4${nbsp}kg a week asks ${DEFICIT}${nbsp}kcal a day, more than your maintenance of ${MAINTENANCE}${nbsp}kcal: no deficit is applied`
      : `1.4${nbsp}kg a week · no deficit applied: your maintenance of ${MAINTENANCE}${nbsp}kcal can’t carry ${DEFICIT}${nbsp}kcal a day`;
  return (
    <>
      <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
        Goal
      </Text>
      <View className="gap-grid-2 rounded-card bg-surface p-grid-2">
        <View>
          <Text className="font-weighed text-title text-ink">{`50.0 → 45.0${nbsp}kg`}</Text>
          <View className="flex-row gap-grid-1">
            {variant === 'A' ? null : <Pause size={18} />}
            <Text className="flex-1 font-language text-label text-ink-mid">{said}</Text>
          </View>
        </View>
        <Button label="Change goal" onPress={() => undefined} secondary />
      </View>
    </>
  );
}

export default function Suspended() {
  const { variant: asked } = useLocalSearchParams<{ variant?: string }>();
  const [variant, setVariant] = useState<Variant>(asked === 'B' || asked === 'C' ? asked : 'A');
  const [page, setPage] = useState<Page>('today');
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-grid-2 px-page pb-grid-3 pt-grid-2"
    >
      <Bar>
        <Chips chips={VARIANTS} chosen={variant} onChoose={setVariant} />
        <Chips chips={PAGES} chosen={page} onChoose={setPage} />
      </Bar>
      {page === 'today' ? <Today variant={variant} /> : <Profile variant={variant} />}
    </ScrollView>
  );
}
