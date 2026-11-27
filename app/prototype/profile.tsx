// THROWAWAY: the Profile tab (epic 2). See app/prototype/NOTES.md.
import { Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { Failure } from '@/components/Failure';
import { Input } from '@/components/Input';
import { FAULT_SIGN } from '@/components/signs';
import { Text } from '@/components/Text';
import { useTint } from '@/components/useTint';

import { Bar, Chips, type Chip } from './today-targets';

const nbsp = String.fromCharCode(0xa0);

type Variant = 'A' | 'B';
type State = 'beforeSetup' | 'noGoal' | 'goalSet' | 'goalForm' | 'goalRefused';

const VARIANTS: Chip<Variant>[] = [
  { label: 'A goal form inline', value: 'A' },
  { label: 'B goal behind a button', value: 'B' },
];

const STATES: Chip<State>[] = [
  { label: 'Before Setup', value: 'beforeSetup' },
  { label: 'No goal', value: 'noGoal' },
  { label: 'Goal set', value: 'goalSet' },
  { label: 'Goal form', value: 'goalForm' },
  { label: 'Goal refused', value: 'goalRefused' },
];

const TITLES: Partial<Record<State, string>> = {
  goalForm: 'Set goal',
  goalRefused: 'Set goal',
};

const Heading = ({ children }: { children: string }) => (
  <Text accessibilityRole="header" className="pt-grid-1 font-language-bold text-body text-ink">
    {children}
  </Text>
);

const Card = ({ children }: { children: ReactNode }) => (
  <View className="gap-grid-2 rounded-card bg-surface p-grid-2">{children}</View>
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

function Body({ state, variant }: { state: State; variant: Variant }) {
  switch (state) {
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
    default:
      return (
        <>
          <Heading>Goal</Heading>
          <GoalCard state={state} variant={variant} />
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
