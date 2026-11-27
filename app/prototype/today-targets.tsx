// THROWAWAY: Today with its targets (epic 2). See app/prototype/NOTES.md.
import { useLocalSearchParams } from 'expo-router';
import { cssInterop } from 'nativewind';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { CardSlice } from '@/components/CardSlice';
import { EmptyLine } from '@/components/EmptyLine';
import { FIGURE_SET } from '@/components/figureSet';
import { Hairline } from '@/components/Hairline';
import { Row } from '@/components/Row';
import { Text } from '@/components/Text';
import { useRipple } from '@/components/useRipple';

cssInterop(Circle, { className: { target: false, nativeStyleToProp: { stroke: true } } });

const nbsp = String.fromCharCode(0xa0);

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
type Arc = { radius: number; width: number; filled: number; stroke: string };

const SIZE = 240;

const ArcTrack = ({ radius, width, filled, stroke }: Arc) => {
  const around = 2 * Math.PI * radius;
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

type Variant = 'A' | 'B' | 'C';
type State =
  | 'before'
  | 'empty'
  | 'progress'
  | 'target'
  | 'slightly'
  | 'over'
  | 'atLeast'
  | 'notStated'
  | 'estimates';

const VARIANTS: Chip<Variant>[] = [
  { label: 'A weight first', value: 'A' },
  { label: 'B ring first', value: 'B' },
  { label: 'C weight in ring', value: 'C' },
];

const STATES: Chip<State>[] = [
  { label: 'Before Setup', value: 'before' },
  { label: 'No entries', value: 'empty' },
  { label: 'In progress', value: 'progress' },
  { label: 'On target', value: 'target' },
  { label: 'Slightly over', value: 'slightly' },
  { label: 'Over', value: 'over' },
  { label: 'At least', value: 'atLeast' },
  { label: 'Protein not stated', value: 'notStated' },
  { label: 'Estimates only', value: 'estimates' },
];

/** A day against a budget of 1840 kcal and a floor of 132 g. */
type Day = {
  verdict: string;
  verdictInk: string;
  centre: string;
  unit: string;
  /** The day's calories are estimates alone, so the figure is set lighter and says *about*. */
  about?: boolean;
  /** The centre takes the standing's hue once the day is past its budget. */
  centreInk?: string;
  stroke: string;
  calories: number;
  protein: number;
  proteinWords: string;
  entries: Entry[];
  weighedIn: boolean;
};

type Entry = { name: string; detail: string; figure: string; estimated?: boolean };

const OATS: Entry = {
  name: 'Rolled oats',
  detail: `80${nbsp}g, 10${nbsp}g protein`,
  figure: `303${nbsp}kcal`,
};
const MILK: Entry = {
  name: 'Milk, semi-skimmed',
  detail: `250${nbsp}g, 9${nbsp}g protein`,
  figure: `118${nbsp}kcal`,
};
const CHICKEN: Entry = {
  name: 'Chicken thigh, roasted',
  detail: `180${nbsp}g, 46${nbsp}g protein`,
  figure: `376${nbsp}kcal`,
};
const LUNCH: Entry = {
  name: 'Lunch at the canteen',
  detail: 'Estimate, protein not stated',
  figure: `about 650${nbsp}kcal`,
  estimated: true,
};
const PUB: Entry = {
  name: 'Pub dinner',
  detail: 'Estimate, protein not stated',
  figure: `about 900${nbsp}kcal`,
  estimated: true,
};
const SANDWICH: Entry = {
  name: 'Sandwich from the bakery',
  detail: `Estimate, 22${nbsp}g protein`,
  figure: `about 480${nbsp}kcal`,
  estimated: true,
};

const WITHIN = { stroke: 'stroke-within', centreInk: 'text-ink' };

const DAYS: Record<Exclude<State, 'before'>, Day> = {
  empty: {
    verdict: 'Nothing logged yet',
    verdictInk: 'text-ink-mid',
    centre: '1840',
    unit: 'kcal left',
    ...WITHIN,
    calories: 0,
    protein: 0,
    proteinWords: `132${nbsp}g protein to go`,
    entries: [],
    weighedIn: false,
  },
  progress: {
    verdict: 'In progress',
    verdictInk: 'text-ink-mid',
    centre: '620',
    unit: 'kcal left',
    ...WITHIN,
    calories: 0.66,
    protein: 0.48,
    proteinWords: `69${nbsp}g protein to go`,
    entries: [OATS, MILK, CHICKEN],
    weighedIn: true,
  },
  target: {
    verdict: 'On target',
    verdictInk: 'text-within',
    centre: '45',
    unit: 'kcal left',
    ...WITHIN,
    calories: 0.98,
    protein: 1,
    proteinWords: 'protein floor met',
    entries: [OATS, MILK, CHICKEN, CHICKEN],
    weighedIn: true,
  },
  slightly: {
    verdict: 'Slightly over',
    verdictInk: 'text-slightly-over',
    centre: '96',
    unit: 'kcal over',
    stroke: 'stroke-slightly-over',
    centreInk: 'text-slightly-over',
    calories: 1,
    protein: 1,
    proteinWords: 'protein floor met',
    entries: [OATS, MILK, CHICKEN, CHICKEN, LUNCH],
    weighedIn: true,
  },
  over: {
    verdict: 'Over budget',
    verdictInk: 'text-over',
    centre: '410',
    unit: 'kcal over',
    stroke: 'stroke-over',
    centreInk: 'text-over',
    calories: 1,
    protein: 0.8,
    proteinWords: `26${nbsp}g protein to go`,
    entries: [OATS, MILK, CHICKEN, PUB],
    weighedIn: true,
  },
  atLeast: {
    verdict: 'In progress',
    verdictInk: 'text-ink-mid',
    centre: '520',
    unit: 'kcal left',
    ...WITHIN,
    calories: 0.72,
    protein: 0.3,
    proteinWords: `at least 40${nbsp}g, floor 132${nbsp}g`,
    entries: [OATS, LUNCH, MILK],
    weighedIn: true,
  },
  notStated: {
    verdict: 'In progress',
    verdictInk: 'text-ink-mid',
    centre: '290',
    unit: 'kcal left',
    about: true,
    ...WITHIN,
    calories: 0.84,
    protein: 0,
    proteinWords: 'protein not stated',
    entries: [LUNCH, PUB],
    weighedIn: true,
  },
  estimates: {
    verdict: 'In progress',
    verdictInk: 'text-ink-mid',
    centre: '710',
    unit: 'kcal left',
    about: true,
    ...WITHIN,
    calories: 0.61,
    protein: 0.17,
    proteinWords: `110${nbsp}g protein to go`,
    entries: [SANDWICH, LUNCH],
    weighedIn: false,
  },
};

const BEFORE: Day = { ...DAYS.progress, weighedIn: false };

/** A text action at a card's end, as `EmptyLine`'s. */
const Action = ({ label }: { label: string }) => (
  <Pressable
    accessibilityRole="button"
    onPress={() => undefined}
    android_ripple={useRipple('page')}
    className="min-h-target min-w-target items-center justify-center ios:active:opacity-60"
  >
    <Text className="font-language-bold text-body text-ink">{label}</Text>
  </Pressable>
);

/** The reference's *Today's weight* card, or its empty line. */
const WeightTile = ({ weighedIn }: { weighedIn: boolean }) =>
  weighedIn ? (
    <View className="flex-row flex-wrap items-center justify-between gap-x-grid-2 rounded-card bg-surface px-grid-2 py-grid-1">
      <View>
        <Text className="font-language-bold text-body text-ink">Today’s weight</Text>
        <Text className="font-weighed text-title text-ink">{`82.0${nbsp}kg`}</Text>
      </View>
      <Action label="Edit" />
    </View>
  ) : (
    <EmptyLine words="No weight logged today." action="Log weight" onAction={() => undefined} />
  );

/** Today's weigh-in as the ring card's last row. */
const WeightRow = ({ weighedIn }: { weighedIn: boolean }) => (
  <View className="mt-grid-2">
    <View className="border-t border-line" />
    <View className="flex-row flex-wrap items-center justify-between gap-x-grid-2 pt-grid-1">
      {weighedIn ? (
        <>
          <Text className="font-language text-body text-ink">Weight</Text>
          <View className="flex-row items-center gap-grid-1">
            <Text className="font-weighed text-body text-ink">{`82.0${nbsp}kg`}</Text>
            <Action label="Edit" />
          </View>
        </>
      ) : (
        <>
          <Text className="font-language text-body text-ink-mid">No weight logged today</Text>
          <Action label="Log weight" />
        </>
      )}
    </View>
  </View>
);

const RingCard = ({ day, weight }: { day: Day; weight?: ReactNode }) => {
  const figureFace = day.about ? 'font-estimated' : 'font-weighed';
  const figureInk = day.about && day.centreInk === 'text-ink' ? 'text-ink-mid' : day.centreInk;
  return (
    <View className="rounded-card bg-surface p-grid-2">
      <View
        accessible
        accessibilityLabel={`${day.verdict}, ${day.about ? 'about ' : ''}${day.centre} ${day.unit}, ${day.proteinWords}`}
        className="items-center"
      >
        <View className="items-center justify-center">
          <Svg width={SIZE} height={SIZE}>
            <ArcTrack radius={110} width={14} filled={day.calories} stroke={day.stroke} />
            <ArcTrack radius={88} width={8} filled={day.protein} stroke="stroke-within" />
          </Svg>
          <View className="absolute items-center">
            {day.about ? (
              <Text className="font-language text-label text-ink-mid">about</Text>
            ) : null}
            <Text className={`text-figure ${figureFace} ${figureInk}`}>{day.centre}</Text>
            <Text className="font-language text-label text-ink-mid">{day.unit}</Text>
          </View>
        </View>
        <Text className={`mt-grid-1 text-center font-language-bold text-body ${day.verdictInk}`}>
          {day.verdict}
        </Text>
        <Text
          className={`text-center text-label ${
            day.proteinWords === 'protein not stated'
              ? 'font-absence text-ink-dim'
              : 'font-language text-ink-mid'
          }`}
        >
          {day.proteinWords}
        </Text>
      </View>
      {weight}
    </View>
  );
};

/** Epic 1's totals card, which stands until there is a budget. */
const Totals = () => (
  <View className="rounded-card bg-surface p-grid-2">
    <Text className="font-weighed text-title text-ink">{`797${nbsp}kcal`}</Text>
    <Text className="font-language text-label text-ink-mid">{`65${nbsp}g protein`}</Text>
  </View>
);

const Entries = ({ entries }: { entries: Entry[] }) => (
  <View>
    {entries.length > 0 ? (
      <View className="flex-row flex-wrap items-baseline justify-between gap-x-grid-2 pb-grid-2 pt-grid-1">
        <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
          Today · Fri 27 Nov
        </Text>
        <Text className="font-language text-label text-ink-mid">
          {`${entries.length} entries · `}
          <Text className={FIGURE_SET.weighed}>{`1,220${nbsp}kcal`}</Text>
        </Text>
      </View>
    ) : null}
    {entries.length === 0 ? (
      <EmptyLine
        words="Log a weighed food, or an estimate."
        action="Log"
        onAction={() => undefined}
      />
    ) : (
      entries.slice(-3).map((entry, index, shown) => (
        <View key={`${entry.name}${index}`}>
          {index > 0 ? <Hairline /> : null}
          <CardSlice first={index === 0} last={index === shown.length - 1}>
            <Row {...entry} spoken={`${entry.name}, ${entry.detail}, ${entry.figure}`} />
          </CardSlice>
        </View>
      ))
    )}
  </View>
);

export default function TodayTargets() {
  const { variant: asked } = useLocalSearchParams<{ variant?: string }>();
  const [variant, setVariant] = useState<Variant>(asked === 'B' || asked === 'C' ? asked : 'A');
  const [state, setState] = useState<State>('progress');
  const day = state === 'before' ? BEFORE : DAYS[state];
  const setupLine = (
    <EmptyLine
      words="Finish setup to see your calorie budget"
      action="Profile"
      onAction={() => undefined}
    />
  );
  const summary =
    state === 'before' ? (
      <>
        {setupLine}
        <Totals />
      </>
    ) : (
      <RingCard
        day={day}
        weight={variant === 'C' ? <WeightRow weighedIn={day.weighedIn} /> : undefined}
      />
    );
  const tile =
    state === 'before' || variant !== 'C' ? <WeightTile weighedIn={day.weighedIn} /> : null;
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-grid-2 px-page py-grid-2"
    >
      <Bar>
        <Chips chips={VARIANTS} chosen={variant} onChoose={setVariant} />
        <Chips chips={STATES} chosen={state} onChoose={setState} />
      </Bar>
      {variant === 'A' ? (
        <>
          {state === 'before' ? setupLine : null}
          {tile}
          {state === 'before' ? <Totals /> : summary}
        </>
      ) : (
        <>
          {summary}
          {tile}
        </>
      )}
      <Entries entries={day.entries} />
    </ScrollView>
  );
}
