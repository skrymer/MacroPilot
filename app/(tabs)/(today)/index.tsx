import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import { FlatList, View } from 'react-native';

import { dayWords } from '@/components/dayWords';
import { CardSlice } from '@/components/CardSlice';
import { DeletableRow } from '@/components/DeletableRow';
import { EmptyLine } from '@/components/EmptyLine';
import { entryFigures, entryWords, tallyWords, totalsWords } from '@/components/entryWords';
import { kg, spokenKg } from '@/components/figures';
import { FIGURE_SET } from '@/components/figureSet';
import { Hairline } from '@/components/Hairline';
import { useLogged } from '@/components/LoggedContext';
import { Row } from '@/components/Row';
import { ShowAll } from '@/components/ShowAll';
import { Text } from '@/components/Text';
import { TextAction } from '@/components/TextAction';
import { Unreadable } from '@/components/Unreadable';
import { useDelete } from '@/components/useDelete';
import { useFailedInView } from '@/components/useFailedInView';
import { totalsOf, type Totals as DayTotals } from '@/domain/dailyLog';
import { shownName } from '@/domain/shownName';
import type { WeighIn } from '@/domain/weighIn';
import { useToday } from '@/lifecycle/useToday';
import type { LoggedEntry } from '@/storage/EntryStore';
import { useEntryStore } from '@/storage/EntryStoreContext';
import { useReading } from '@/storage/useReading';
import { useProfile } from '@/storage/useProfile';
import { useWeighIns } from '@/storage/useWeighIns';

const PROTEIN_SET = { ...FIGURE_SET, weighed: 'font-language text-ink-mid' };

function Totals({
  totals,
  count,
  children,
}: {
  totals: DayTotals;
  count: number;
  /** The card's last row. */
  children: ReactNode;
}) {
  const { calories, caloriesKind, protein, proteinKind, spoken } = totalsWords(totals);
  return (
    <View className="rounded-card bg-surface p-grid-2">
      <View
        accessible
        accessibilityLabel={`${spoken} today${count === 0 ? ', nothing logged yet' : ''}`}
      >
        <Text className={`text-title ${FIGURE_SET[caloriesKind]}`}>{calories}</Text>
        <Text className={`text-label ${PROTEIN_SET[proteinKind]}`}>{protein}</Text>
        {count === 0 ? (
          <Text className="font-language text-label text-ink-mid">Nothing logged yet</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/**
 * Before Setup, what is missing for a calorie budget and the way to it: a weigh-in is logged here, and
 * the details on Profile. Nothing once both are there.
 */
function SetupLine({
  hasProfile,
  hasWeighIn,
  onProfile,
  onWeighIn,
}: {
  hasProfile: boolean;
  hasWeighIn: boolean;
  onProfile: () => void;
  onWeighIn: () => void;
}) {
  if (hasProfile && hasWeighIn) return null;
  if (hasProfile) {
    return (
      <EmptyLine
        words="Log your weight to see your calorie budget"
        action="Log weight"
        onAction={onWeighIn}
      />
    );
  }
  return (
    <EmptyLine
      words={`Add your details${hasWeighIn ? '' : ' and log your weight'} to see your calorie budget`}
      action="Profile"
      onAction={onProfile}
    />
  );
}

/** Today's weigh-in, as the day card's last row. */
function WeightRow({ weighIn, onLog }: { weighIn?: WeighIn; onLog: () => void }) {
  return (
    <View className="mt-grid-2">
      <View className="border-t border-line" />
      <View className="flex-row flex-wrap items-center justify-between gap-x-grid-2 pt-grid-1">
        {weighIn ? (
          <>
            <View
              accessible
              accessibilityLabel={`Weight today, ${spokenKg(weighIn.kg)}`}
              className="min-w-name flex-1 flex-row flex-wrap items-baseline justify-between gap-x-grid-2"
            >
              <Text className="font-language text-body text-ink">Weight</Text>
              <Text className={`text-body ${FIGURE_SET.weighed}`}>{kg(weighIn.kg)}</Text>
            </View>
            <TextAction label="Edit" spoken="Edit today’s weight" onPress={onLog} />
          </>
        ) : (
          <>
            <Text className="font-language text-body text-ink-mid">No weight logged today</Text>
            <TextAction label="Log weight" onPress={onLog} />
          </>
        )}
      </View>
    </View>
  );
}

function DayHeading({ day, count, totals }: { day: string; count: number; totals: DayTotals }) {
  const { count: entries, calories, caloriesKind, spoken } = tallyWords(count, totals);
  return (
    <View className="flex-row flex-wrap items-baseline justify-between gap-x-grid-2 pt-grid-1">
      <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
        {`Today · ${dayWords(day)}`}
      </Text>
      <Text accessibilityLabel={spoken} className="font-language text-label text-ink-mid">
        {`${entries} · `}
        <Text className={FIGURE_SET[caloriesKind]}>{calories}</Text>
      </Text>
    </View>
  );
}

/** How many entries are shown before the rest are asked for. */
const LAST = 3;

export default function Today() {
  const router = useRouter();
  const store = useEntryStore();
  const day = useToday();
  const list = useCallback(() => store.listOn(day), [store, day]);
  const { found, readAgain } = useReading(list);
  const { weighIns, readAgain: readWeighInsAgain } = useWeighIns();
  const { profile } = useProfile();
  const weighedToday = Array.isArray(weighIns)
    ? weighIns.find((weighIn) => weighIn.day === day)
    : undefined;
  // An entry can be written after the user has come here from its form.
  const [logged] = useLogged();
  const navigation = useNavigation();
  const readIt = useEffectEvent(() => {
    if (navigation.isFocused()) void readAgain();
  });
  useEffect(() => {
    if (logged) readIt();
  }, [logged]);
  const deletion = useDelete<LoggedEntry>({
    title: 'Delete this entry?',
    message: (entry) =>
      `${shownName(entry.name)}, ${entryFigures(entry).shown} will be removed, and that day’s totals re-derive without it.`,
    remove: ({ id }) => store.delete(id),
    failed: 'Could not delete entry',
    onDeleted: readAgain,
  });
  const listed = Array.isArray(found) ? found : [];
  const totals = totalsOf(listed);
  // The day all of which was asked for, and no other day.
  const [allOf, setAllOf] = useState<string>();
  const all = allOf === day;
  const setAll = (asked: boolean) => setAllOf(asked ? day : undefined);
  const shown = all ? listed : listed.slice(-LAST);
  const asksForRest = listed.length > LAST;
  const faultInView = useFailedInView(shown, deletion.fault);
  return (
    <FlatList
      {...faultInView.list}
      // iOS's large title follows the scroll only with the insets its bars ask for.
      contentInsetAdjustmentBehavior="automatic"
      data={shown}
      ListFooterComponent={
        asksForRest ? (
          <CardSlice first={false} last>
            <Hairline />
            <ShowAll
              label={all ? 'Show less' : `Show all ${listed.length}`}
              opens={all ? 'up' : 'down'}
              onPress={() => setAll(!all)}
            />
          </CardSlice>
        ) : undefined
      }
      keyExtractor={({ id }) => String(id)}
      renderItem={({ item, index }) => {
        const name = shownName(item.name);
        const words = entryWords(name, item);
        return (
          <CardSlice first={index === 0} last={index === shown.length - 1 && !asksForRest}>
            <DeletableRow
              ref={item.id === deletion.fault?.id ? faultInView.row : undefined}
              onDelete={() => void deletion.begin(item)}
              fault={item.id === deletion.fault?.id ? deletion.fault.why : undefined}
            >
              <Row name={name} {...words} onDelete={() => void deletion.begin(item)} />
            </DeletableRow>
          </CardSlice>
        );
      }}
      contentContainerClassName="px-page py-grid-2"
      ItemSeparatorComponent={Hairline}
      ListEmptyComponent={
        Array.isArray(found) ? (
          <EmptyLine
            words="Log a weighed food, or an estimate."
            action="Log"
            onAction={() => router.navigate('/log')}
          />
        ) : undefined
      }
      ListHeaderComponent={
        <View className="gap-grid-2 pb-grid-1">
          {found === 'unreadable' ? (
            <Unreadable words="Couldn’t load today’s summary" onRetry={readAgain} />
          ) : null}
          {Array.isArray(profile) && Array.isArray(weighIns) ? (
            <SetupLine
              hasProfile={profile.length > 0}
              hasWeighIn={weighIns.length > 0}
              onProfile={() => router.navigate('/profile')}
              onWeighIn={() => router.navigate('/log-weight')}
            />
          ) : null}
          {Array.isArray(found) ? (
            <Totals totals={totals} count={listed.length}>
              {weighIns === 'unreadable' ? (
                <View className="mt-grid-2">
                  <Unreadable words="Couldn’t load your weight" onRetry={readWeighInsAgain} />
                </View>
              ) : Array.isArray(weighIns) ? (
                <WeightRow weighIn={weighedToday} onLog={() => router.navigate('/log-weight')} />
              ) : null}
            </Totals>
          ) : null}
          {listed.length > 0 ? (
            <DayHeading day={day} count={listed.length} totals={totals} />
          ) : null}
        </View>
      }
    />
  );
}
