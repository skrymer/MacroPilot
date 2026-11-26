import { cssInterop } from 'nativewind';
import type { ReactNode } from 'react';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Appearance, Pressable, ScrollView, useColorScheme, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Failure } from '@/components/Failure';
import { Link } from '@/components/Link';
import { Text } from '@/components/Text';
import { useRipple } from '@/components/useRipple';
import { useTint } from '@/components/useTint';

/**
 * Trim, the living design reference. Every token and treatment in DESIGN.md renders here; if the
 * two disagree, this page is wrong. Read it in both appearances: the switch changes the whole app's,
 * until it is next launched.
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
  <View className="mb-3 rounded-card bg-surface p-4">{children}</View>
);

/** The no-break space between a figure and its unit (DESIGN.md, *Figures*). */
const NBSP = String.fromCharCode(0xa0);

type Sign = { ios: SFSymbol; android: AndroidSymbol };

const WARNING: Sign = { ios: 'exclamationmark.triangle.fill', android: 'warning' };
const TICK: Sign = { ios: 'checkmark.circle.fill', android: 'check_circle' };

/** What failed, where it failed: the app's own `Failure`, `fault` with the warning sign. */
const Failed = ({ words }: { words: string }) => (
  <View className="mb-3">
    <Failure words={words} />
  </View>
);

/** A form's field: its label, a fault's words above it, and its state at its end. */
const Field = ({
  label,
  value,
  state,
  fault,
}: {
  label: string;
  value: string;
  state?: 'valid' | 'fault';
  fault?: string;
}) => {
  const tint = useTint();
  const outline =
    state === 'fault'
      ? 'border-2 border-fault bg-fault/10'
      : state === 'valid'
        ? 'border-2 border-valid bg-valid/10'
        : 'border border-edge bg-surface-lift';
  return (
    <View className="gap-1">
      <Text className="font-language text-label text-ink-mid">{label}</Text>
      {fault ? <Text className="font-language text-label text-fault">{fault}</Text> : null}
      <View
        className={`min-h-target flex-row items-center justify-between rounded-2xl px-3 ${outline}`}
      >
        <Text className="font-language text-body text-ink">{value}</Text>
        {state ? (
          <SymbolView
            name={state === 'fault' ? WARNING : TICK}
            size={20}
            tintColor={state === 'fault' ? tint.fault : tint.valid}
          />
        ) : null}
      </View>
    </View>
  );
};

/** A row of a list in its card, its figures at its end: it is deleted by a swipe, nothing drawn for it. */
const ListRow = ({ name, detail, figure, estimated = false }: ListRowProps) => (
  <View className="flex-row flex-wrap items-center justify-between gap-x-2 py-3">
    <View className="min-w-name flex-1">
      <Text className="font-language text-body text-ink">{name}</Text>
      <Text className="font-language text-label text-ink-mid">{detail}</Text>
    </View>
    <Text
      className={`text-body ${estimated ? 'font-estimated text-ink-mid' : 'font-weighed text-ink'}`}
    >
      {figure}
    </Text>
  </View>
);

/** A row swiped to the left: *Delete* in `fault`, reaching the card's rounded edge. */
const SwipedRow = () => (
  <View className="flex-row">
    <View className="flex-1 py-3 pl-page">
      <Text numberOfLines={1} className="font-language text-body text-ink">
        Black coffee
      </Text>
      <Text numberOfLines={1} className="font-language text-label text-ink-mid">
        {`250${NBSP}g, 0${NBSP}g protein`}
      </Text>
    </View>
    <View className="items-center justify-center bg-fault px-5">
      <Text className="font-language-bold text-body text-ground">Delete</Text>
    </View>
  </View>
);

type ListRowProps = { name: string; detail: string; figure: string; estimated?: boolean };

/** The way on from an empty list, at the end of its one line. */
const LogAction = () => (
  <Pressable
    accessibilityRole="button"
    android_ripple={useRipple('page')}
    className="min-h-target min-w-target items-center justify-center ios:active:opacity-60"
  >
    <Text className="font-language-bold text-body text-ink">Log</Text>
  </Pressable>
);

/** The rest of a long day, asked for by the card's own last row. */
const ShowAll = () => {
  const tint = useTint();
  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={useRipple('page')}
      className="min-h-target min-w-target flex-row items-center justify-between py-3 ios:active:opacity-60"
    >
      <Text className="font-language-bold text-body text-ink">Show all 5</Text>
      <SymbolView
        name={{ ios: 'chevron.down', android: 'expand_more' }}
        size={18}
        tintColor={tint['ink-mid']}
      />
    </Pressable>
  );
};

/** A page with nothing else on it: a sign, a line, a detail and the way on. */
const QuietEmpty = () => {
  const tint = useTint();
  return (
    <View className="mb-3 items-center gap-grid-1 px-page py-grid-3">
      <SymbolView
        name={{ ios: 'fork.knife', android: 'restaurant' }}
        size={32}
        tintColor={tint['ink-mid']}
      />
      <Text className="text-center font-language-bold text-body text-ink">
        Build your food catalog
      </Text>
      <Text className="text-center font-language text-label text-ink-mid">
        Add the foods you eat regularly so logging takes a tap.
      </Text>
      <View className="mt-grid-1 self-stretch">
        <Action label="Add your first food" />
      </View>
    </View>
  );
};

/** What worked, on another page: a card with the tick that a valid field has. */
const Logged = () => {
  const tint = useTint();
  return (
    <View className="mb-3 flex-row items-center gap-3 rounded-card bg-surface p-4">
      <SymbolView name={TICK} size={22} tintColor={tint.valid} />
      <View className="flex-1">
        <Text className="font-language-bold text-body text-ink">Logged: Rolled oats</Text>
        <Text className="font-language text-label text-ink-mid">
          {`80${NBSP}g, 294${NBSP}kcal, 10${NBSP}g protein`}
        </Text>
      </View>
    </View>
  );
};

type Arc = { radius: number; width: number; filled: number; stroke: string };

/** Wide enough that the words under the figure clear the inner arc at double text, at 320dp. */
const SIZE = 240;

const ArcTrack = ({ radius, width, filled, stroke }: Arc) => {
  const around = 2 * Math.PI * radius;
  // Rounded ends that would meet across a small gap read as a fault in the drawing.
  const nearlyClosed = around * (1 - filled) < 2 * width;
  const shape = { cx: SIZE / 2, cy: SIZE / 2, r: radius, strokeWidth: width, fill: 'none' };
  return (
    <>
      <Circle {...shape} className="stroke-line" />
      {filled > 0 ? (
        <Circle
          {...shape}
          className={stroke}
          strokeLinecap={nearlyClosed ? 'butt' : 'round'}
          strokeDasharray={filled < 1 ? `${around * filled} ${around}` : undefined}
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
  proteinLeft: string;
  calories: number;
  protein: number;
  stroke: string;
  text: string;
  /** Ink until the day is past its budget, then the verdict's own hue. */
  figure?: string;
};

const DAYS: Day[] = [
  {
    state: 'Nothing logged yet',
    centre: '1840',
    unit: 'kcal left',
    proteinLeft: '132\u00A0g protein to go',
    calories: 0,
    protein: 0,
    stroke: 'stroke-within',
    text: 'text-ink-mid',
  },
  {
    state: 'In progress',
    centre: '620',
    unit: 'kcal left',
    proteinLeft: '69\u00A0g protein to go',
    calories: 0.66,
    protein: 0.48,
    stroke: 'stroke-within',
    text: 'text-ink-mid',
  },
  {
    state: 'On target',
    centre: '45',
    unit: 'kcal left',
    proteinLeft: 'protein floor met',
    calories: 0.98,
    protein: 1,
    stroke: 'stroke-within',
    text: 'text-within',
  },
  {
    state: 'Slightly over',
    centre: '96',
    unit: 'kcal over',
    proteinLeft: 'protein floor met',
    calories: 1,
    protein: 1,
    stroke: 'stroke-slightly-over',
    text: 'text-slightly-over',
    figure: 'text-slightly-over',
  },
  {
    state: 'Over budget',
    centre: '410',
    unit: 'kcal over',
    proteinLeft: '26\u00A0g protein to go',
    calories: 1,
    protein: 0.8,
    stroke: 'stroke-over',
    text: 'text-over',
    figure: 'text-over',
  },
];

const DayRing = ({
  state,
  centre,
  unit,
  proteinLeft,
  calories,
  protein,
  stroke,
  text,
  figure = 'text-ink',
}: Day) => (
  <Card>
    <Ring
      label={`${state}, ${centre} ${unit}, ${proteinLeft}`}
      arcs={[
        { radius: 110, width: 14, filled: calories, stroke },
        { radius: 88, width: 8, filled: protein, stroke: 'stroke-within' },
      ]}
    >
      <Text className={`font-weighed text-figure ${figure}`}>{centre}</Text>
      <Text className="font-language text-label text-ink-mid">{unit}</Text>
    </Ring>
    <Text className={`mt-3 text-center font-language-bold text-body ${text}`}>{state}</Text>
    <Text className="text-center font-language text-label text-ink-mid">{proteinLeft}</Text>
  </Card>
);

type EntrySpecimen = { name: string; detail: string; first?: boolean; children: ReactNode };

/** The figure stands beside the name while both fit, and drops below it when they do not. */
const Entry = ({ name, detail, first = false, children }: EntrySpecimen) => (
  <View
    className={`min-h-target flex-row flex-wrap items-center justify-between gap-x-4 border-line py-3 ${
      first ? '' : 'border-t'
    }`}
  >
    <View className="min-w-name flex-1">
      <Text className="font-language text-body text-ink">{name}</Text>
      <Text className="font-language text-label text-ink-mid">{detail}</Text>
    </View>
    {children}
  </View>
);

/** Every button shows the platform's press: iOS dims it, Android ripples. */
const Action = ({ label, solid = false }: { label: string; solid?: boolean }) => (
  <Pressable
    accessibilityRole="button"
    android_ripple={useRipple(solid ? 'ink' : 'page')}
    className={`mb-3 min-h-target min-w-target items-center justify-center overflow-hidden rounded-full px-5 ios:active:opacity-60 ${
      solid ? 'bg-ink' : 'border border-ink'
    }`}
  >
    <Text
      className={`text-center font-language-bold text-body ${solid ? 'text-ground' : 'text-ink'}`}
    >
      {label}
    </Text>
  </Pressable>
);

const APPEARANCES = [
  ['Light', 'light'],
  ['Dark', 'dark'],
] as const;

/** Shows the appearance in force, and switches the whole app's until it is next launched. */
const AppearanceSwitch = () => {
  const inForce = useColorScheme();
  const ripple = { ink: useRipple('ink'), page: useRipple('page') };
  return (
    <View className="mt-6 flex-row flex-wrap gap-2">
      {APPEARANCES.map(([label, value]) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          accessibilityState={{ selected: inForce === value }}
          onPress={() => Appearance.setColorScheme(value)}
          android_ripple={ripple[inForce === value ? 'ink' : 'page']}
          className={`min-h-target min-w-target grow items-center justify-center overflow-hidden rounded-full border border-ink px-4 ios:active:opacity-60 ${
            inForce === value ? 'bg-ink' : ''
          }`}
        >
          <Text
            className={`font-language-bold text-label ${inForce === value ? 'text-ground' : 'text-ink'}`}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const TABS = ['Today', 'Log', 'Review', 'Foods', 'Profile'];

const ASKING = [
  ['Grams, an estimate, a food', 'iOS\u2019s page sheet, or a full page on Android, with an X'],
  ['Deleting, or discarding a food', 'The system\u2019s own question'],
  ['It worked, and the page shows it', 'Nothing is said'],
] as const;

const GROUNDS = [
  ['ground', 'bg-ground'],
  ['surface', 'bg-surface'],
  ['surface-lift', 'bg-surface-lift'],
] as const;

export default function Design() {
  const { bottom } = useSafeAreaInsets();
  return (
    <SafeAreaView className="flex-1 bg-ground" edges={['top']}>
      <ScrollView
        contentContainerClassName="px-4 pt-4"
        // Content scrolls under the home indicator, and stops clear of it.
        contentContainerStyle={{ paddingBottom: bottom + 64 }}
      >
        <Text accessibilityRole="header" className="font-language-bold text-figure text-ink">
          Trim
        </Text>
        <Text className="mt-2 font-language text-body text-ink-mid">
          Food has no colour. Colour is only where your day stands against its targets.
        </Text>
        <AppearanceSwitch />
        {__DEV__ ? (
          <Link
            href="/prototype/colours"
            className="font-language-bold text-body text-ink underline"
          >
            Colours prototype
          </Link>
        ) : null}

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
              arcs={[{ radius: 110, width: 14, filled: 0.58, stroke: 'stroke-within' }]}
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
          <View className="mb-3 rounded-card bg-surface px-page py-1">
            <Entry first name="Chicken thigh, roasted" detail={'180\u00A0g, 46\u00A0g protein'}>
              <Text className="font-weighed text-body text-ink">{'376\u00A0kcal'}</Text>
            </Entry>
            <Entry name="Lunch at the canteen" detail="Estimate, protein not stated">
              <Text className="font-estimated text-body text-ink-mid">{'about 650\u00A0kcal'}</Text>
            </Entry>
            <Entry name="Black coffee" detail={'250\u00A0g, 0\u00A0g protein'}>
              <Text className="font-weighed text-body text-ink">{'0\u00A0kcal'}</Text>
            </Entry>
            <Entry name="Fibre" detail={'Rye bread, per 100\u00A0g'}>
              <Text className="font-absence text-body text-ink-dim">not stated</Text>
            </Entry>
          </View>
        </Section>

        <Section
          title="A day's totals"
          note="One weighed entry makes the calories solid. Protein says when it is only part of the answer."
        >
          <Card>
            <Text className="font-weighed text-title text-ink">{'1425\u00A0kcal'}</Text>
            <Text className="font-language text-label text-ink-mid">
              {'at least 66\u00A0g protein'}
            </Text>
          </Card>
          <Card>
            <Text className="font-estimated text-title text-ink-mid">{'about 850\u00A0kcal'}</Text>
            <Text className="font-absence text-label text-ink-dim">protein not stated</Text>
          </Card>
          <Card>
            <Text className="font-weighed text-title text-ink">{'0\u00A0kcal'}</Text>
            <Text className="mb-3 font-language text-label text-ink-mid">
              {'0\u00A0g protein. Nothing logged yet'}
            </Text>
            <Action solid label="Log" />
          </Card>
        </Section>

        <Section
          title="Actions"
          note="Ink, never a hue: a button expresses no verdict. A secondary is outlined. A press dims on iOS and ripples on Android."
        >
          <Action solid label={'Log 180\u00A0g'} />
          <Action label="Log an estimate instead" />
        </Section>

        <Section
          title="A list"
          note="Its rows in one card. A row is deleted by a swipe to the left, which asks once open; a screen reader has Delete among its actions. The tally's calories are a figure. The rest of a long day is the card's last row."
        >
          <View className="mb-1 flex-row flex-wrap items-baseline justify-between gap-x-4">
            <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
              Today · Thu 26 Nov
            </Text>
            <Text className="font-language text-label text-ink-mid">
              {'5 entries · '}
              <Text className="font-weighed text-ink">{`2,610${NBSP}kcal`}</Text>
            </Text>
          </View>
          <View className="mb-3 rounded-card bg-surface px-page">
            <ListRow
              name="Lunch at the canteen"
              detail="Estimate, protein not stated"
              figure={`about 650${NBSP}kcal`}
              estimated
            />
            <View className="border-t border-line" />
            <ListRow
              name="Black coffee"
              detail={`250${NBSP}g, 0${NBSP}g protein`}
              figure={`0${NBSP}kcal`}
            />
            <View className="border-t border-line" />
            <ShowAll />
          </View>
          <View className="mb-3 overflow-hidden rounded-card bg-surface">
            <SwipedRow />
          </View>
        </Section>

        <Section
          title="An empty list"
          note="Under a summary, one line in the list's card with its way on. On a page with nothing else, the quiet empty state."
        >
          <View className="mb-3 min-h-target flex-row flex-wrap items-center justify-between gap-x-4 rounded-card bg-surface px-page py-2">
            <Text className="font-language text-body text-ink-mid">
              Log a weighed food, or an estimate.
            </Text>
            <LogAction />
          </View>
          <QuietEmpty />
        </Section>

        <Section
          title="A form"
          note="Its fields in one card. A fault in red with a sign, its words above the field; a valid field in green with a tick, judged once it is left. The button at the foot."
        >
          <View className="mb-3 gap-grid-2 rounded-card bg-surface p-grid-2">
            <Field label="Label" value="Lunch at the canteen" state="valid" />
            <Field
              label="Calories"
              value="six hundred"
              state="fault"
              fault="Enter calories as a number"
            />
            <Field label="Protein (optional)" value="" />
          </View>
          <Failed words="Not saved. A field above needs changing." />
          <Action solid label="Log estimated entry" />
        </Section>

        <Section
          title="Navigation"
          note="The system's bar. A tab goes to a page. There is no More."
        >
          <Card>
            {TABS.map((tab) => (
              <Text key={tab} className="py-1 font-language text-body text-ink">
                {tab}
              </Text>
            ))}
          </Card>
        </Section>

        <Section
          title="Asking and telling"
          note="No toasts. What worked on another page is said in a card with a tick, and stays. A failure is said in red with its sign, where it happened."
        >
          <Logged />
          <Card>
            <Failed words="Could not save entry. What you typed is still here." />
            <Action solid label="Log entry" />
          </Card>
          <Card>
            <Failed words={'Couldn\u2019t load today\u2019s summary'} />
            <Action label="Retry" />
          </Card>
          <View className="rounded-card bg-surface px-page py-1">
            {ASKING.map(([when, what], index) => (
              <Entry key={when} first={index === 0} name={when} detail={what}>
                {null}
              </Entry>
            ))}
          </View>
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

        <Section
          title="Grounds"
          note="Neutral, with a cool pine tint. Nothing here means anything."
        >
          {GROUNDS.map(([name, background]) => (
            <View key={name} className={`mb-2 rounded-card border border-line p-4 ${background}`}>
              <Text className="font-language text-label text-ink">{name}</Text>
            </View>
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
