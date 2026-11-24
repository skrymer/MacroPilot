// One face at a time, from the per-face entry point: the package root ships every weight.
import { B612_400Regular } from '@expo-google-fonts/b612/400Regular';
import { B612_400Regular_Italic } from '@expo-google-fonts/b612/400Regular_Italic';
import { B612_700Bold } from '@expo-google-fonts/b612/700Bold';
import { useFonts } from 'expo-font';
import { cssInterop } from 'nativewind';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/Text';

/**
 * Trim, the living design reference. Every token and treatment in DESIGN.md renders here; if the
 * two disagree, this page is wrong. It follows the phone's appearance, so read it in both.
 *
 * The faces are loaded here while they are being judged. Once settled they load in the root layout.
 */

// A token reaches a circle's stroke through its class, as it reaches a View's background.
cssInterop(Circle, { className: { target: false, nativeStyleToProp: { stroke: true } } });

const Section = ({ title, note, children }: Specimen) => (
  <View className="mt-10">
    <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
      {title}
    </Text>
    <Text className="mb-4 mt-1 font-language text-label text-ink-mid">{note}</Text>
    {children}
  </View>
);

type Specimen = { title: string; note: string; children: ReactNode };

const Card = ({ children }: { children: ReactNode }) => (
  <View className="mb-3 rounded-2xl bg-surface p-4">{children}</View>
);

type Arc = { radius: number; width: number; filled: number; stroke: string };

const SIZE = 200;

const ArcTrack = ({ radius, width, filled, stroke }: Arc) => {
  const around = 2 * Math.PI * radius;
  const shape = { cx: SIZE / 2, cy: SIZE / 2, r: radius, strokeWidth: width, fill: 'none' };
  return (
    <>
      <Circle {...shape} className="stroke-line" />
      {filled > 0 ? (
        <Circle
          {...shape}
          className={stroke}
          strokeLinecap="round"
          strokeDasharray={`${around * Math.min(filled, 1)} ${around}`}
          rotation={-90}
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      ) : null}
    </>
  );
};

const Ring = ({ arcs, label, children }: { arcs: Arc[]; label: string; children: ReactNode }) => (
  <View accessible accessibilityLabel={label} className="items-center justify-center self-center">
    <Svg width={SIZE} height={SIZE}>
      {arcs.map((arc) => (
        <ArcTrack key={arc.radius} {...arc} />
      ))}
    </Svg>
    <View className="absolute items-center">{children}</View>
  </View>
);

type Day = {
  state: string;
  centre: string;
  unit: string;
  calories: number;
  protein: number;
  stroke: string;
  text: string;
};

const DAYS: Day[] = [
  {
    state: 'Nothing logged yet',
    centre: '1840',
    unit: 'kcal left',
    calories: 0,
    protein: 0,
    stroke: 'stroke-within',
    text: 'text-ink-mid',
  },
  {
    state: 'In progress',
    centre: '620',
    unit: 'kcal left',
    calories: 0.66,
    protein: 0.48,
    stroke: 'stroke-within',
    text: 'text-ink-mid',
  },
  {
    state: 'On target',
    centre: '45',
    unit: 'kcal left',
    calories: 0.98,
    protein: 1,
    stroke: 'stroke-within',
    text: 'text-within',
  },
  {
    state: 'Slightly over',
    centre: '96',
    unit: 'kcal over',
    calories: 1,
    protein: 1,
    stroke: 'stroke-slightly-over',
    text: 'text-slightly-over',
  },
  {
    state: 'Over budget',
    centre: '410',
    unit: 'kcal over',
    calories: 1,
    protein: 0.8,
    stroke: 'stroke-over',
    text: 'text-over',
  },
];

const DayRing = ({ state, centre, unit, calories, protein, stroke, text }: Day) => (
  <Card>
    <Ring
      label={`${state}, ${centre} ${unit}`}
      arcs={[
        { radius: 90, width: 14, filled: calories, stroke },
        { radius: 70, width: 8, filled: protein, stroke: 'stroke-within' },
      ]}
    >
      <Text className="font-weighed text-figure text-ink">{centre}</Text>
      <Text className="font-language text-label text-ink-mid">{unit}</Text>
    </Ring>
    <Text className={`mt-3 text-center font-language-bold text-body ${text}`}>{state}</Text>
  </Card>
);

const Entry = ({
  name,
  detail,
  children,
}: {
  name: string;
  detail: string;
  children: ReactNode;
}) => (
  <View className="min-h-target flex-row items-center justify-between gap-4 border-b border-line py-2">
    <View className="flex-1">
      <Text className="font-language text-body text-ink">{name}</Text>
      <Text className="font-language text-label text-ink-mid">{detail}</Text>
    </View>
    {children}
  </View>
);

const Action = ({ label, solid = false }: { label: string; solid?: boolean }) => (
  <Pressable
    accessibilityRole="button"
    className={`mb-3 min-h-target min-w-target items-center justify-center rounded-full px-5 ${
      solid ? 'bg-ink' : 'border border-ink'
    }`}
  >
    <Text className={`font-language-bold text-body ${solid ? 'text-ground' : 'text-ink'}`}>
      {label}
    </Text>
  </Pressable>
);

const GROUNDS = [
  ['ground', 'bg-ground'],
  ['surface', 'bg-surface'],
  ['surface-lift', 'bg-surface-lift'],
] as const;

export default function Design() {
  const [loaded, failed] = useFonts({ B612_400Regular, B612_400Regular_Italic, B612_700Bold });
  if (!loaded && !failed) return null;
  return (
    <SafeAreaView className="flex-1 bg-ground">
      <ScrollView contentContainerClassName="px-4 pb-16 pt-4">
        <Text accessibilityRole="header" className="font-language-bold text-figure text-ink">
          Trim
        </Text>
        <Text className="mt-2 font-language text-body text-ink-mid">
          Food has no colour. Colour is only where your day stands against its targets.
        </Text>

        <Section
          title="The day ring"
          note="The full circle is the target. Outer is calories, inner and thinner is protein."
        >
          {DAYS.map((day) => (
            <DayRing key={day.state} {...day} />
          ))}
        </Section>

        <Section title="The goal ring" note="One arc, closing on a target weight.">
          <Card>
            <Ring
              label="Goal, 4.2 kilograms to go"
              arcs={[{ radius: 90, width: 14, filled: 0.58, stroke: 'stroke-within' }]}
            >
              <Text className="font-weighed text-figure text-ink">4.2</Text>
              <Text className="font-language text-label text-ink-mid">kg to go</Text>
            </Ring>
          </Card>
        </Section>

        <Section
          title="Figures"
          note="Weighed is solid. Estimated is lighter, and says so. An unknown is words. A known zero is a figure."
        >
          <Card>
            <Entry name="Chicken thigh, roasted" detail="180 g, 46 g protein">
              <Text className="font-weighed text-body text-ink">376 kcal</Text>
            </Entry>
            <Entry name="Lunch at the canteen" detail="Estimate, protein not stated">
              <Text className="font-estimated text-body text-ink-mid">about 650 kcal</Text>
            </Entry>
            <Entry name="Black coffee" detail="250 g, 0 g protein">
              <Text className="font-weighed text-body text-ink">{'0\u00A0kcal'}</Text>
            </Entry>
            <Entry name="Fibre" detail="Rye bread, per 100 g">
              <Text className="font-absence text-body text-ink-dim">not stated</Text>
            </Entry>
          </Card>
        </Section>

        <Section title="Actions" note="Ink, never a hue: a button expresses no verdict.">
          <Action solid label="Log 180 g" />
          <Action label="Log an estimate instead" />
        </Section>

        <Section title="Type" note="B612, drawn for cockpit displays. Every digit is one width.">
          <Text className="font-weighed text-figure-lg text-ink">1840</Text>
          <Text className="font-weighed text-figure text-ink">
            132<Text className="font-language text-unit text-ink-mid"> g</Text>
          </Text>
          <Text className="font-language-bold text-title text-ink">Title</Text>
          <Text className="font-language text-body text-ink">Body, read in a few seconds</Text>
          <Text className="font-language text-label text-ink-mid">Label</Text>
          <Text className="font-language-bold text-eyebrow text-ink-dim">Eyebrow</Text>
        </Section>

        <Section title="Grounds" note="Neutral, a little warm. Nothing here means anything.">
          {GROUNDS.map(([name, background]) => (
            <View key={name} className={`mb-2 rounded-2xl border border-line p-4 ${background}`}>
              <Text className="font-language text-label text-ink">{name}</Text>
            </View>
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
