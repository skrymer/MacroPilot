// THROWAWAY: the colours prototype (#51). See app/prototype/NOTES.md.
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { cssInterop, vars } from 'nativewind';
import { useState } from 'react';
import {
  Appearance,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useColorScheme,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Hairline } from '@/components/Hairline';
import { Input } from '@/components/Input';
import { Row } from '@/components/Row';
import { Text } from '@/components/Text';

import { CANDIDATES, variablesOf } from '../../prototype-palettes';

cssInterop(Circle, { className: { target: false, nativeStyleToProp: { stroke: true } } });

const nbsp = String.fromCharCode(0xa0);

export type Chip<T extends string> = { label: string; value: T };

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

type Screen = 'today' | 'log' | 'form';
type Standing = 'empty' | 'within' | 'slightly-over' | 'over';

const SCREENS: Chip<Screen>[] = [
  { label: 'Today', value: 'today' },
  { label: 'Log', value: 'log' },
  { label: 'Form', value: 'form' },
];

const STANDINGS: Chip<Standing>[] = [
  { label: 'Empty', value: 'empty' },
  { label: 'Within', value: 'within' },
  { label: 'Slightly over', value: 'slightly-over' },
  { label: 'Over', value: 'over' },
];

const APPEARANCES: Chip<'light' | 'dark'>[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const SWATCHES = [
  'bg-ground',
  'bg-surface',
  'bg-surface-lift',
  'bg-line',
  'bg-ink-dim',
  'bg-ink-mid',
  'bg-ink',
  'bg-within',
  'bg-slightly-over',
  'bg-over',
];

/* Today ------------------------------------------------------------------------------------- */

const SIZE = 240;

function Arc({
  radius,
  width,
  filled,
  stroke,
}: Record<'radius' | 'width' | 'filled', number> & { stroke: string }) {
  const around = 2 * Math.PI * radius;
  const nearlyClosed = around * (1 - filled) < 2 * width;
  const shape = { cx: SIZE / 2, cy: SIZE / 2, r: radius, strokeWidth: width, fill: 'none' };
  return (
    <>
      <Circle {...shape} className="stroke-line" />
      {/* An empty day is an empty track: a round cap on nothing would draw a dot. */}
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
}

const ENTRIES = [
  { name: 'Rolled oats', detail: `80${nbsp}g, 10${nbsp}g protein`, figure: `294${nbsp}kcal` },
  {
    name: 'Chicken thigh, roasted',
    detail: `180${nbsp}g, 46${nbsp}g protein`,
    figure: `376${nbsp}kcal`,
  },
  {
    name: 'Lunch at the canteen',
    detail: 'Estimate, protein not stated',
    figure: `about 650${nbsp}kcal`,
    estimated: true,
  },
  { name: 'Black coffee', detail: `250${nbsp}g, 0${nbsp}g protein`, figure: `0${nbsp}kcal` },
];

const DINNER = { name: 'Dinner out', detail: 'Estimate, protein not stated', estimated: true };

/** A budget of 2200 kcal and a protein floor of 140 g; the first four entries are 1320 kcal and 56 g. */
const DAYS: Record<
  Standing,
  {
    centre: string;
    unit: string;
    words: string;
    calories: number;
    dinner?: number;
    figure: string;
    stroke: string;
    wordsHue: string;
  }
> = {
  empty: {
    centre: '2200',
    unit: 'kcal left',
    words: 'Nothing logged yet',
    calories: 0,
    figure: 'text-ink',
    stroke: 'stroke-within',
    wordsHue: 'text-ink-mid',
  },
  within: {
    centre: '880',
    unit: 'kcal left',
    words: 'Within budget',
    calories: 0.6,
    figure: 'text-ink',
    stroke: 'stroke-within',
    wordsHue: 'text-within',
  },
  'slightly-over': {
    centre: '96',
    unit: 'kcal over',
    words: 'Slightly over',
    calories: 1,
    dinner: 976,
    figure: 'text-slightly-over',
    stroke: 'stroke-slightly-over',
    wordsHue: 'text-slightly-over',
  },
  over: {
    centre: '410',
    unit: 'kcal over',
    words: 'Over budget',
    calories: 1,
    dinner: 1290,
    figure: 'text-over',
    stroke: 'stroke-over',
    wordsHue: 'text-over',
  },
};

type Deletion = 'word' | 'bin' | 'bin-mid' | 'swipe';

type Empty = 'card' | 'quiet' | 'in-list';

/**
 * Q13, what an empty list says: epic 1's card (a bold line, a detail and a primary button); a quiet
 * empty state, centred, with a sign and an outlined button, as Health's *No Data* and Material's empty
 * state; or one line in the list's own card, with its way on at the right.
 */
function EmptyList({
  empty,
  title,
  detail,
  action,
  sign,
  palette,
}: {
  empty: Empty;
  title: string;
  detail: string;
  action: string;
  sign: { ios: 'fork.knife'; android: 'restaurant' };
  palette: Palette;
}) {
  const look: ButtonLook = { secondary: 'outlined', press: 'platform', palette };
  if (empty === 'in-list') {
    // The summary above already says the day is empty, so the line gives only the way on.
    return (
      <View
        className={`${LIST} min-h-target flex-row flex-wrap items-center justify-between gap-x-4 py-2`}
      >
        <Text className="font-language text-body text-ink-mid">{detail}</Text>
        <Pressable
          accessibilityRole="button"
          className="min-h-target min-w-target items-center justify-center active:opacity-60"
        >
          <Text className="font-language-bold text-body text-ink">{action}</Text>
        </Pressable>
      </View>
    );
  }
  if (empty === 'quiet') {
    return (
      <View className="items-center gap-2 px-4 py-8">
        <SymbolView name={sign} size={32} tintColor={palette['ink-mid']} />
        <Text className="text-center font-language-bold text-body text-ink">{title}</Text>
        <Text className="text-center font-language text-label text-ink-mid">{detail}</Text>
        <View className="mt-2 self-stretch">
          <TrialButton label={action} look={look} />
        </View>
      </View>
    );
  }
  return (
    <View className="gap-4 rounded-2xl bg-surface p-4">
      <View>
        <Text className="font-language-bold text-body text-ink">{title}</Text>
        <Text className="font-language text-label text-ink-mid">{detail}</Text>
      </View>
      <TrialButton label={action} primary look={look} />
    </View>
  );
}

/** What a swipe to the left shows. */
const SwipedDelete = ({ name }: { name: string }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`Delete ${name}`}
    className="min-h-target min-w-target items-center justify-center bg-over px-5"
  >
    <Text className="font-language-bold text-body text-ground">Delete</Text>
  </Pressable>
);

/** How many entries Today shows before the rest are asked for, as epic 1's. */
const LAST = 3;

type More = 'button' | 'row';

/**
 * Q16, the rest of a long day: epic 1's outlined button under the card; or the card's own last row,
 * *Show all 5* with a chevron, as Health's *Show All Data*. The switch sits under the list here.
 */
const MORES: Chip<More>[] = [
  { label: 'Button under', value: 'button' },
  { label: 'Row in the card', value: 'row' },
];

type Failure = 'none' | 'unreadable' | 'refused';
type FailureLook = 'ink' | 'red';

const FAILURES: Chip<Failure>[] = [
  { label: 'No failure', value: 'none' },
  { label: 'Cannot read', value: 'unreadable' },
  { label: 'Delete failed', value: 'refused' },
];

/** What went wrong, said where it happened, with the warning sign when it takes the red. */
function FailureWords({
  words,
  look,
  palette,
}: {
  words: string;
  look: FailureLook;
  palette: Palette;
}) {
  return (
    <View accessibilityRole="alert" className="flex-row items-center gap-2">
      {look === 'red' ? (
        <SymbolView
          name={{ ios: 'exclamationmark.triangle.fill', android: 'warning' }}
          size={18}
          tintColor={palette.over}
        />
      ) : null}
      <Text
        className={`flex-1 font-language-bold text-body ${look === 'red' ? 'text-over' : 'text-ink'}`}
      >
        {words}
      </Text>
    </View>
  );
}

function Today({
  standing,
  deletion,
  empty,
  failure,
  failureLook,
  palette,
}: {
  standing: Standing;
  deletion: Deletion;
  empty: Empty;
  failure: Failure;
  failureLook: FailureLook;
  palette: Palette;
}) {
  const day = DAYS[standing];
  const entries = day.dinner
    ? [...ENTRIES, { ...DINNER, figure: `about ${day.dinner}${nbsp}kcal` }]
    : ENTRIES;
  const total = 1320 + (day.dinner ?? 0);
  if (failure === 'unreadable') {
    return (
      <View className="gap-4 rounded-2xl bg-surface p-4">
        <FailureWords words="Couldn’t load today’s summary" look={failureLook} palette={palette} />
        <TrialButton label="Retry" look={{ secondary: 'outlined', press: 'platform', palette }} />
      </View>
    );
  }
  return (
    <>
      <View className="rounded-2xl bg-surface p-4">
        <View
          accessible
          accessibilityLabel={`${day.words}, ${day.centre} ${day.unit}`}
          className="items-center justify-center self-center"
        >
          <Svg width={SIZE} height={SIZE}>
            <Arc radius={110} width={14} filled={day.calories} stroke={day.stroke} />
            <Arc
              radius={88}
              width={8}
              filled={standing === 'empty' ? 0 : 0.4}
              stroke="stroke-within"
            />
          </Svg>
          <View className="absolute items-center">
            <Text className={`font-weighed text-figure ${day.figure}`}>{day.centre}</Text>
            <Text className="font-language text-label text-ink-mid">{day.unit}</Text>
          </View>
        </View>
        <Text className={`mt-3 text-center font-language-bold text-body ${day.wordsHue}`}>
          {day.words}
        </Text>
        <Text className="text-center font-language text-label text-ink-mid">
          {standing === 'empty'
            ? `140${nbsp}g protein to go`
            : `at least 56${nbsp}g protein, 84${nbsp}g to go`}
        </Text>
      </View>
      {standing === 'empty' ? (
        <EmptyList
          empty={empty}
          title="Nothing logged yet"
          detail="Log a weighed food, or an estimate."
          action="Log"
          sign={{ ios: 'fork.knife', android: 'restaurant' }}
          palette={palette}
        />
      ) : (
        <TodayList
          entries={entries}
          total={total}
          deletion={deletion}
          refused={failure === 'refused' ? failureLook : undefined}
          palette={palette}
        />
      )}
    </>
  );
}

function TodayList({
  entries,
  total,
  deletion,
  refused,
  palette,
}: {
  entries: (typeof ENTRIES)[number][];
  total: number;
  deletion: Deletion;
  /** The second row's delete failed, said over the row, in this look. */
  refused?: FailureLook;
  palette: Palette;
}) {
  const [all, setAll] = useState(false);
  const [more, setMore] = useState<More>('row');
  const shown = all ? entries : entries.slice(-LAST);
  const label = all ? 'Show less' : `Show all ${entries.length}`;
  const hidden = entries.length > LAST;
  return (
    <>
      <View className="flex-row flex-wrap items-baseline justify-between gap-x-4 pt-3">
        <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
          Today · Thu 26 Nov
        </Text>
        <Text className="font-language text-label text-ink-mid">
          {`${entries.length} entries · ${total.toLocaleString('en')}${nbsp}kcal`}
        </Text>
      </View>
      {/* NativeWind does not style the gesture root, so the card is a View around it. */}
      <View className={`${LIST} overflow-hidden`}>
        <GestureHandlerRootView>
          {shown.map((entry, index) => (
            <View key={entry.name}>
              {index > 0 ? <Hairline /> : null}
              {refused && index === 1 ? (
                <View className="pt-3">
                  <FailureWords
                    words="Could not delete entry. Try again."
                    look={refused}
                    palette={palette}
                  />
                </View>
              ) : null}
              <ReanimatedSwipeable
                enabled={deletion === 'swipe'}
                friction={2}
                rightThreshold={40}
                renderRightActions={() => <SwipedDelete name={entry.name} />}
              >
                <View className="flex-row flex-wrap items-center justify-between gap-x-2 bg-surface">
                  <View className="min-w-name flex-1">
                    <Row {...entry} spoken={`${entry.name}, ${entry.figure}`} />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${entry.name}`}
                    className="min-h-target min-w-target items-center justify-center"
                  >
                    {deletion === 'word' ? (
                      <Text className="font-language text-body text-ink">Delete</Text>
                    ) : (
                      <SymbolView
                        name={{ ios: 'trash', android: 'delete' }}
                        size={22}
                        tintColor={deletion === 'bin' ? palette.ink : palette['ink-mid']}
                      />
                    )}
                  </Pressable>
                </View>
              </ReanimatedSwipeable>
            </View>
          ))}
        </GestureHandlerRootView>
        {hidden && more === 'row' ? (
          <>
            <Hairline />
            <Pressable
              accessibilityRole="button"
              onPress={() => setAll(!all)}
              className="min-h-target min-w-target flex-row items-center justify-between py-3 active:opacity-60"
            >
              <Text className="font-language-bold text-body text-ink">{label}</Text>
              <SymbolView
                name={{
                  ios: all ? 'chevron.up' : 'chevron.down',
                  android: all ? 'expand_less' : 'expand_more',
                }}
                size={18}
                tintColor={palette['ink-mid']}
              />
            </Pressable>
          </>
        ) : null}
      </View>
      {hidden && more === 'button' ? (
        <TrialButton
          label={label}
          onPress={() => setAll(!all)}
          look={{ secondary: 'outlined', press: 'platform', palette }}
        />
      ) : null}
      <Chips chips={MORES} chosen={more} onChoose={setMore} />
      <Text className="font-absence text-label text-ink-dim">fibre not stated</Text>
    </>
  );
}

/* Log --------------------------------------------------------------------------------------- */

const FOODS = [
  ['Chicken thigh, roasted', 26, 209],
  ['Greek yoghurt, 2%', 10, 73],
  ['Rolled oats', 13, 367],
  ['Rye bread', 6, 211],
  ['Skyr, plain', 11, 63],
] as const;

type Secondary = 'outlined' | 'tonal';
type Press = 'none' | 'platform';

type ButtonLook = { secondary: Secondary; press: Press; palette: Palette };

function TrialButton({
  label,
  primary = false,
  onPress,
  look: { secondary, press, palette },
}: {
  label: string;
  primary?: boolean;
  onPress?: () => void;
  look: ButtonLook;
}) {
  const ground = primary
    ? 'bg-ink'
    : secondary === 'tonal'
      ? 'bg-surface-lift'
      : 'border border-ink';
  const dims = press === 'platform' && Platform.OS === 'ios' ? 'active:opacity-60' : '';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={
        press === 'platform'
          ? { color: primary ? palette.ground : palette['ink-mid'], foreground: true }
          : undefined
      }
      className={`min-h-target min-w-target items-center justify-center overflow-hidden rounded-full px-5 ${ground} ${dims}`}
    >
      <Text
        className={`text-center font-language-bold text-body ${primary ? 'text-ground' : 'text-ink'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type Told = 'card' | 'tick' | 'line';

/**
 * Q15, telling what worked on another page: epic 1's card; the card with a green tick, as a valid
 * field has; or one quiet line with the tick, no card.
 */
function Logged({ told, palette }: { told: Told; palette: Palette }) {
  const tick =
    told === 'card' ? null : (
      <SymbolView
        name={{ ios: 'checkmark.circle.fill', android: 'check_circle' }}
        size={told === 'line' ? 18 : 22}
        tintColor={palette.within}
      />
    );
  const figures = `80${nbsp}g, 294${nbsp}kcal, 10${nbsp}g protein`;
  if (told === 'line') {
    return (
      <View accessible className="flex-row flex-wrap items-center gap-x-2">
        {tick}
        <Text className="font-language-bold text-label text-ink">Logged: Rolled oats</Text>
        <Text className="font-language text-label text-ink-mid">{figures}</Text>
      </View>
    );
  }
  return (
    <View accessible className="flex-row items-center gap-3 rounded-2xl bg-surface p-4">
      {tick}
      <View className="flex-1">
        <Text className="font-language-bold text-body text-ink">Logged: Rolled oats</Text>
        <Text className="font-language text-label text-ink-mid">{figures}</Text>
      </View>
    </View>
  );
}

function Log({ look, told }: { look: ButtonLook; told: Told }) {
  return (
    <>
      <Logged told={told} palette={look.palette} />
      <TrialButton label="Log an estimate instead" look={look} />
      <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
        All foods
      </Text>
      <View className={LIST}>
        {FOODS.map(([name, protein, calories], index) => (
          <View key={name}>
            {index > 0 ? <Hairline /> : null}
            <Row
              name={name}
              detail={`${protein}${nbsp}g protein per 100${nbsp}g`}
              figure={`${calories}${nbsp}kcal`}
              spoken={`Log ${name}`}
              onPress={() => undefined}
            />
          </View>
        ))}
      </View>
    </>
  );
}

/* A form ------------------------------------------------------------------------------------ */

type FaultStyle = 'words' | 'marked' | 'below' | 'colour' | 'colour-one';

export type Palette = (typeof CANDIDATES)[number]['light'];

/**
 * Q6: a field's fault as words alone, or with the field outlined in ink and a warning sign; or the
 * user's mockup of 26 November, against the thesis: each field in a card, a valid one in `within`'s
 * green with a tick, one at fault in `over`'s red with a warning and its words above it.
 */
function Field({
  label,
  value,
  fault,
  valid = false,
  placeholder,
  faultStyle,
  palette,
}: {
  label: string;
  value?: string;
  fault?: string;
  valid?: boolean;
  placeholder?: string;
  faultStyle: FaultStyle;
  palette: Palette;
}) {
  if (faultStyle === 'colour' || faultStyle === 'colour-one') {
    const sign = fault
      ? { name: { ios: 'exclamationmark.triangle.fill', android: 'warning' }, tint: palette.over }
      : valid
        ? { name: { ios: 'checkmark.circle.fill', android: 'check_circle' }, tint: palette.within }
        : undefined;
    const outline = fault
      ? 'border-2 border-over bg-over/10'
      : valid
        ? 'border-2 border-within bg-within/10'
        : 'border border-line';
    return (
      <View className={faultStyle === 'colour' ? 'gap-1 rounded-2xl bg-surface p-3' : 'gap-1'}>
        <Text className="font-language text-label text-ink-mid">{label}</Text>
        {fault ? <Text className="font-language text-label text-over">{fault}</Text> : null}
        <View className="justify-center">
          <Input
            accessibilityLabel={label}
            defaultValue={value}
            placeholder={placeholder}
            className={`pr-10 font-language text-body ${outline}`}
          />
          {sign ? (
            <View className="absolute right-3">
              <SymbolView
                name={sign.name as { ios: 'checkmark.circle.fill'; android: 'check_circle' }}
                size={20}
                tintColor={sign.tint}
              />
            </View>
          ) : null}
        </View>
      </View>
    );
  }
  const marked = fault && faultStyle !== 'words';
  const words = fault ? (
    <View className="flex-row items-center gap-1">
      {marked ? (
        <SymbolView
          name={{ ios: 'exclamationmark.triangle.fill', android: 'warning' }}
          size={16}
          tintColor={palette.ink}
        />
      ) : null}
      <Text className="flex-1 font-language-bold text-label text-ink">{fault}</Text>
    </View>
  ) : null;
  return (
    <View className="gap-1">
      <Text className="font-language text-label text-ink-mid">{label}</Text>
      {faultStyle === 'below' ? null : words}
      <Input
        accessibilityLabel={label}
        defaultValue={value}
        placeholder={placeholder}
        className={`font-language text-body ${marked ? 'border-2 border-ink' : ''}`}
      />
      {faultStyle === 'below' ? words : null}
    </View>
  );
}

/** The way out in the system's header: the word on iOS, Material's close X on Android. */
export function HeaderCancel({ ink, onPress }: { ink: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cancel"
      onPress={onPress}
      className="min-h-target min-w-target items-center justify-center"
    >
      {Platform.OS === 'ios' ? (
        <Text className="font-language text-body text-ink">Cancel</Text>
      ) : (
        // The header is drawn outside the page and its tokens: the variant's ink, as a value.
        <SymbolView name={{ android: 'close' }} size={24} tintColor={ink} />
      )}
    </Pressable>
  );
}

export function Form({ faultStyle, palette }: { faultStyle: FaultStyle; palette: Palette }) {
  const style = { faultStyle, palette };
  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-4 pb-4"
      >
        <View
          className={faultStyle === 'colour-one' ? 'gap-4 rounded-2xl bg-surface p-3' : 'gap-4'}
        >
          <Field label="Label" value="Lunch at the canteen" valid {...style} />
          <Field
            label="Calories"
            value="six hundred"
            fault="Enter calories as a number"
            {...style}
          />
          <Field label="Protein (optional)" placeholder="e.g. 30" {...style} />
        </View>
      </ScrollView>
      <View className="gap-2 px-4 py-2">
        <FailureWords
          words="Not saved. A field above needs changing."
          look="red"
          palette={palette}
        />
        <TrialButton
          label="Log estimated entry"
          primary
          look={{ secondary: 'outlined', press: 'platform', palette }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

/* The page ---------------------------------------------------------------------------------- */

/** D39, decided 26 November 2026: a list's rows stand in one rounded card, as Health's sections. */
const LIST = 'rounded-2xl bg-surface px-4';

/** Decided 26 November 2026: C, the pine neutrals with emerald as `within`. */
export const CHOSEN = CANDIDATES.find((c) => c.key === 'C')!;

/**
 * Decided 26 November 2026: the system draws a page's title. iOS draws its own bar: clear over the
 * large title, glass once the page scrolls under it, as Health's; a colour of ours would make it
 * opaque. Android's bar takes the ground. The header takes colours as values, not classes.
 */
export const headerFor = (palette: Palette, title: string) => {
  const face = { fontFamily: 'B612_700Bold', color: palette.ink };
  return {
    headerShown: true,
    title,
    headerShadowVisible: false,
    headerBackVisible: false,
    ...(Platform.OS === 'ios'
      ? { headerTransparent: true }
      : { headerStyle: { backgroundColor: palette.ground } }),
    headerTitleStyle: face,
    headerLargeTitleStyle: face,
    headerTintColor: palette.ink,
  };
};

const HEADINGS: Record<Exclude<Screen, 'form'>, string> = { today: 'Today', log: 'Log' };

export default function ColoursPrototype() {
  const router = useRouter();
  const [screen, setScreen] = useState<Exclude<Screen, 'form'>>('today');
  const [standing, setStanding] = useState<Standing>('within');
  const [barShown, setBarShown] = useState(true);
  // Decided 26 November 2026: the quiet bin, and a swipe to delete beside it.
  const deletion: Deletion = 'swipe';
  // Decided 26 November 2026: under a summary, an empty list is one line in its own card.
  const empty: Empty = 'in-list';
  const [failure, setFailure] = useState<Failure>('none');
  // Decided 26 November 2026: a failure anywhere takes a field fault's red and its sign.
  const failureLook: FailureLook = 'red';
  // Decided 26 November 2026: what worked is told in a card with a green tick.
  const told: Told = 'tick';
  // Decided 26 November 2026: a secondary button outlined, and the platform's press on every button.
  const secondary: Secondary = 'outlined';
  const press: Press = 'platform';
  const appearance = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = CHOSEN[appearance];
  const theme = vars(variablesOf(palette));
  // Decided 26 November 2026: every form opens the platform's way, a page sheet on iOS.
  const choose = (chosen: Screen) =>
    chosen === 'form' ? router.navigate('/prototype/form') : setScreen(chosen);
  const bar = barShown ? (
    <View className="mx-2 mt-2 gap-1 rounded-2xl border border-line bg-surface p-2">
      <View className="flex-row flex-wrap items-center justify-between gap-1">
        <Chips chips={SCREENS} chosen={screen} onChoose={choose} />
        <Chips
          chips={[{ label: 'Hide', value: 'hide' }]}
          chosen=""
          onChoose={() => setBarShown(false)}
        />
      </View>
      {screen === 'today' ? (
        <>
          <Chips chips={STANDINGS} chosen={standing} onChoose={setStanding} />
          <Chips chips={FAILURES} chosen={failure} onChoose={setFailure} />
        </>
      ) : null}
      <Chips
        chips={APPEARANCES}
        chosen={appearance}
        onChoose={(value) => Appearance.setColorScheme(value)}
      />
      <View className="flex-row overflow-hidden rounded-full border border-line">
        {SWATCHES.map((swatch) => (
          <View key={swatch} className={`h-3 flex-1 ${swatch}`} />
        ))}
      </View>
    </View>
  ) : (
    <View className="mx-2 mt-2 items-end">
      <Chips
        chips={[{ label: 'Show bar', value: 'show' }]}
        chosen=""
        onChoose={() => setBarShown(true)}
      />
    </View>
  );
  const header = (
    <Stack.Screen
      options={{
        ...headerFor(palette, HEADINGS[screen]),
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerLeft: () => null,
      }}
    />
  );
  // iOS ties its large title to the scroll view only when that is the screen's first view, so it is
  // the root here, the bar at the foot of what scrolls.
  return (
    <>
      {header}
      <ScrollView
        style={theme}
        className="flex-1 bg-ground"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-3 px-4 pb-8"
      >
        {screen === 'today' ? (
          <Today
            standing={standing}
            deletion={deletion}
            empty={empty}
            failure={failure}
            failureLook={failureLook}
            palette={palette}
          />
        ) : (
          <Log look={{ secondary, press, palette }} told={told} />
        )}
        {bar}
      </ScrollView>
    </>
  );
}
