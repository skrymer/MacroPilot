// THROWAWAY: the Profile tab (epic 2). See app/prototype/NOTES.md.
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { Failure } from '@/components/Failure';
import { Input } from '@/components/Input';
import { FAULT_SIGN } from '@/components/signs';
import { Text } from '@/components/Text';
import { useTint } from '@/components/useTint';

import { Bar, Chips, type Chip } from './today-targets';

const nbsp = String.fromCharCode(0xa0);

type Variant = 'A' | 'B';
type State =
  | 'empty'
  | 'beforeSetup'
  | 'noGoal'
  | 'goalSet'
  | 'detailsForm'
  | 'goalForm'
  | 'goalRefused'
  | 'weightForm'
  | 'weightRefused';

const VARIANTS: Chip<Variant>[] = [
  { label: 'A goal form inline', value: 'A' },
  { label: 'B goal behind a button', value: 'B' },
];

const STATES: Chip<State>[] = [
  { label: 'Not filled', value: 'empty' },
  { label: 'Before Setup', value: 'beforeSetup' },
  { label: 'No goal', value: 'noGoal' },
  { label: 'Goal set', value: 'goalSet' },
  { label: 'Details form', value: 'detailsForm' },
  { label: 'Goal form', value: 'goalForm' },
  { label: 'Goal refused', value: 'goalRefused' },
  { label: 'Weight form', value: 'weightForm' },
  { label: 'Weight refused', value: 'weightRefused' },
];

const TITLES: Partial<Record<State, string>> = {
  detailsForm: 'Your details',
  goalForm: 'Set goal',
  goalRefused: 'Set goal',
  weightForm: 'Log weight',
  weightRefused: 'Log weight',
};

const Heading = ({ children }: { children: string }) => (
  <Text accessibilityRole="header" className="pt-grid-1 font-language-bold text-body text-ink">
    {children}
  </Text>
);

const Card = ({ children }: { children: ReactNode }) => (
  <View className="gap-grid-2 rounded-card bg-surface p-grid-2">{children}</View>
);

/** A label and what it holds, one row of a card. */
const Detail = ({ label, value, first }: { label: string; value: string; first?: boolean }) => (
  <View>
    {first ? null : <View className="border-t border-line" />}
    <View className="min-h-target flex-row flex-wrap items-center justify-between gap-x-grid-2 py-grid-1">
      <Text className="font-language text-body text-ink">{label}</Text>
      <Text className="font-language text-body text-ink-mid">{value}</Text>
    </View>
  </View>
);

const Details = () => (
  <>
    <Heading>Your details</Heading>
    <View className="rounded-card bg-surface px-grid-2">
      <Detail first label="Sex" value="Male" />
      <Detail label="Birth date" value="14 March 1984" />
      <Detail label="Height" value={`181${nbsp}cm`} />
      <Detail label="Calorie tracking" value="Calories and weight" />
    </View>
    <Button label="Change details" onPress={() => undefined} secondary />
  </>
);

/** A field as Trim draws one: its label above, its fault's words under the label. */
const Field = ({
  label,
  value,
  fault,
  autoFocus,
}: {
  label: string;
  value?: string;
  fault?: string;
  autoFocus?: boolean;
}) => {
  const tint = useTint();
  const [typed, setTyped] = useState(value ?? '');
  return (
    <View className="gap-1">
      <Text className="font-language text-label text-ink-mid">{label}</Text>
      {fault ? <Text className="font-language-bold text-label text-fault">{fault}</Text> : null}
      <View className="justify-center">
        <Input
          accessibilityLabel={label}
          value={typed}
          onChangeText={setTyped}
          keyboardType="decimal-pad"
          autoFocus={autoFocus}
          className={`font-language text-body ${
            fault ? 'border-2 border-fault bg-fault/10 pr-11' : 'border border-edge bg-surface-lift'
          }`}
        />
        {fault ? (
          <View pointerEvents="none" className="absolute right-3">
            <SymbolView name={FAULT_SIGN} size={20} tintColor={tint.fault} />
          </View>
        ) : null}
      </View>
    </View>
  );
};

/** Two or more answers, one chosen: a segmented choice in ink. */
const Segments = ({ label, options }: { label: string; options: string[] }) => {
  const [chosen, setChosen] = useState(options[0]);
  return (
    <View className="gap-1">
      <Text className="font-language text-label text-ink-mid">{label}</Text>
      <View
        accessibilityRole="radiogroup"
        className="flex-row overflow-hidden rounded-2xl border border-ink"
      >
        {options.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: chosen === option }}
            onPress={() => setChosen(option)}
            className={`min-h-target min-w-target flex-1 items-center justify-center px-2 ${
              chosen === option ? 'bg-ink' : ''
            }`}
          >
            <Text
              className={`text-center font-language-bold text-label ${
                chosen === option ? 'text-ground' : 'text-ink'
              }`}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const BIRTH = new Date(1984, 2, 14);

/** The platform's own date picker: iOS's compact one in place, Android's dialog from a field. */
const BirthDate = () => {
  const [born, setBorn] = useState(BIRTH);
  const shown = born.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <View className="gap-1">
      <Text className="font-language text-label text-ink-mid">Birth date</Text>
      {Platform.OS === 'ios' ? (
        <View className="items-start">
          <DateTimePicker
            value={born}
            mode="date"
            display="compact"
            onChange={(_, date) => date && setBorn(date)}
          />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Birth date, ${shown}`}
          onPress={() =>
            DateTimePickerAndroid.open({
              value: born,
              mode: 'date',
              onChange: (_, date) => date && setBorn(date),
            })
          }
          className="min-h-target min-w-target justify-center rounded-2xl border border-edge bg-surface-lift px-3"
        >
          <Text className="font-language text-body text-ink">{shown}</Text>
        </Pressable>
      )}
    </View>
  );
};

/** A form's fields in one card, and its button at the foot with what it says above it. */
const Form = ({
  action,
  fault,
  children,
}: {
  action: string;
  fault?: string;
  children: ReactNode;
}) => (
  <>
    <Card>{children}</Card>
    <View className="gap-grid-1 pt-grid-1">
      {fault ? <Failure words={fault} /> : null}
      <Button label={action} onPress={() => undefined} />
    </View>
  </>
);

const GoalFields = ({ refused }: { refused?: boolean }) => (
  <>
    <View>
      <Text className="font-language text-label text-ink-mid">Starting weight</Text>
      <Text className="font-weighed text-body text-ink">{`82.4${nbsp}kg`}</Text>
      <Text className="font-language text-label text-ink-mid">
        your trend, smoothed from recent weigh-ins
      </Text>
    </View>
    <Field label="Target weight (kg)" value="75.0" />
    <Field
      label="Rate (kg a week)"
      value={refused ? '1.5' : '0.5'}
      fault={
        refused
          ? 'At your current maintenance of 1480 kcal a day, 1.5 kg a week would leave you nothing to eat. Choose a slower rate.'
          : undefined
      }
    />
  </>
);

const GoalCard = ({ state, variant }: { state: State; variant: Variant }) => {
  if (state === 'beforeSetup')
    return (
      <Card>
        <Text className="font-language text-body text-ink-mid">
          Save your details and log your weight on Today to set a goal.
        </Text>
      </Card>
    );
  if (state === 'goalSet')
    return (
      <Card>
        <View>
          <Text className="font-weighed text-title text-ink">{`82.4 → 75.0${nbsp}kg`}</Text>
          <Text className="font-language text-label text-ink-mid">
            {`0.5${nbsp}kg a week, 550${nbsp}kcal a day under maintenance`}
          </Text>
        </View>
        <Button label="Change goal" onPress={() => undefined} secondary />
      </Card>
    );
  return variant === 'A' ? (
    <>
      <Card>
        <Text className="font-language text-body text-ink-mid">
          {`You’re maintaining: your budget is your maintenance, 2350${nbsp}kcal a day.`}
        </Text>
        <GoalFields />
      </Card>
      <Button label="Set goal" onPress={() => undefined} />
    </>
  ) : (
    <Card>
      <Text className="font-language text-body text-ink-mid">
        {`You’re maintaining: your budget is your maintenance, 2350${nbsp}kcal a day.`}
      </Text>
      <Button label="Set a goal" onPress={() => undefined} secondary />
    </Card>
  );
};

/** The quiet empty state, with a sign for a person rather than Notice's knife and fork. */
const NotFilled = () => {
  const tint = useTint();
  return (
    <View className="items-center gap-grid-1 px-page py-grid-3">
      <SymbolView
        name={{ ios: 'person.crop.circle', android: 'person' }}
        size={32}
        tintColor={tint['ink-mid']}
      />
      <Text className="text-center font-language-bold text-body text-ink">No details yet</Text>
      <Text className="text-center font-language text-label text-ink-mid">
        Your sex, birth date and height set your first calorie budget and protein floor.
      </Text>
      <View className="mt-grid-1 self-stretch">
        <Button label="Add your details" onPress={() => undefined} secondary />
      </View>
    </View>
  );
};

function Body({ state, variant }: { state: State; variant: Variant }) {
  switch (state) {
    case 'empty':
      return <NotFilled />;
    case 'detailsForm':
      return (
        <Form action="Save profile">
          <Segments label="Sex" options={['Male', 'Female']} />
          <BirthDate />
          <Field label="Height (cm)" value="181" />
          <Segments label="Calorie tracking" options={['Calories and weight', 'Weight only']} />
        </Form>
      );
    case 'goalForm':
    case 'goalRefused':
      return (
        <Form
          action="Set goal"
          fault={state === 'goalRefused' ? 'Not saved. A field above needs changing.' : undefined}
        >
          <GoalFields refused={state === 'goalRefused'} />
        </Form>
      );
    case 'weightForm':
    case 'weightRefused':
      return (
        <Form action="Save weight">
          <Field
            label="Weight (kg)"
            value={state === 'weightRefused' ? '820' : undefined}
            fault={state === 'weightRefused' ? 'Enter a weight from 20 to 400 kg' : undefined}
            autoFocus
          />
        </Form>
      );
    default:
      return (
        <>
          <Heading>Goal</Heading>
          <GoalCard state={state} variant={variant} />
          <Details />
        </>
      );
  }
}

export default function ProfilePrototype() {
  const { variant: asked } = useLocalSearchParams<{ variant?: string }>();
  const [variant, setVariant] = useState<Variant>(asked === 'B' ? 'B' : 'A');
  const [state, setState] = useState<State>('noGoal');
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-grid-2 px-page py-grid-2"
    >
      <Stack.Screen options={{ title: TITLES[state] ?? 'Profile' }} />
      <Bar>
        <Chips chips={VARIANTS} chosen={variant} onChoose={setVariant} />
        <Chips chips={STATES} chosen={state} onChoose={setState} />
      </Bar>
      <Body key={state} state={state} variant={variant} />
    </ScrollView>
  );
}
