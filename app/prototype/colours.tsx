// THROWAWAY: the colours prototype (#51). See app/prototype/NOTES.md.
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
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

import { Button } from '@/components/Button';
import { DeletableRow } from '@/components/DeletableRow';
import { Hairline } from '@/components/Hairline';
import { Input } from '@/components/Input';
import { Row } from '@/components/Row';
import { Text } from '@/components/Text';

import { CANDIDATES, variablesOf } from '../../prototype-palettes';

cssInterop(Circle, { className: { target: false, nativeStyleToProp: { stroke: true } } });

const nbsp = String.fromCharCode(0xa0);

type Chip<T extends string> = { label: string; value: T };

function Chips<T extends string>({
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
type Standing = 'within' | 'slightly-over' | 'over';

const SCREENS: Chip<Screen>[] = [
  { label: 'Today', value: 'today' },
  { label: 'Log', value: 'log' },
  { label: 'Form', value: 'form' },
];

const STANDINGS: Chip<Standing>[] = [
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
      <Circle
        {...shape}
        className={stroke}
        strokeLinecap={nearlyClosed ? 'butt' : 'round'}
        strokeDasharray={filled < 1 ? `${around * filled} ${around}` : undefined}
        rotation={-90}
        origin={`${SIZE / 2}, ${SIZE / 2}`}
      />
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

function Today({ standing }: { standing: Standing }) {
  const day = DAYS[standing];
  const entries = day.dinner
    ? [...ENTRIES, { ...DINNER, figure: `about ${day.dinner}${nbsp}kcal` }]
    : ENTRIES;
  const total = 1320 + (day.dinner ?? 0);
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
            <Arc radius={88} width={8} filled={0.4} stroke="stroke-within" />
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
          {`at least 56${nbsp}g protein, 84${nbsp}g to go`}
        </Text>
      </View>
      <View className="flex-row flex-wrap items-baseline justify-between gap-x-4 pt-3">
        <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
          Today · Thu 26 Nov
        </Text>
        <Text className="font-language text-label text-ink-mid">
          {`${entries.length} entries · ${total.toLocaleString('en')}${nbsp}kcal`}
        </Text>
      </View>
      <View className={LIST}>
        {entries.map((entry, index) => (
          <View key={entry.name}>
            {index > 0 ? <Hairline /> : null}
            <DeletableRow name={entry.name} onDelete={() => undefined}>
              <Row {...entry} spoken={`${entry.name}, ${entry.figure}`} />
            </DeletableRow>
          </View>
        ))}
      </View>
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

function Log() {
  return (
    <>
      <View accessible className="rounded-2xl bg-surface p-4">
        <Text className="font-language-bold text-body text-ink">Logged: Rolled oats</Text>
        <Text className="font-language text-label text-ink-mid">
          {`80${nbsp}g, 294${nbsp}kcal, 10${nbsp}g protein`}
        </Text>
      </View>
      <Button label="Log an estimate instead" onPress={() => undefined} secondary />
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
        <Text className="font-language-bold text-body text-ink">
          Not saved. A field above needs changing.
        </Text>
        <Button label="Log estimated entry" onPress={() => undefined} />
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
        <Chips chips={STANDINGS} chosen={standing} onChoose={setStanding} />
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
        {screen === 'today' ? <Today standing={standing} /> : <Log />}
        {bar}
      </ScrollView>
    </>
  );
}
