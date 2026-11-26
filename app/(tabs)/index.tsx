import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { dayWords } from '@/components/dayWords';
import { DeletableRow } from '@/components/DeletableRow';
import { entryFigures, entryWords, tallyWords, totalsWords } from '@/components/entryWords';
import { FIGURE_SET } from '@/components/figureSet';
import { Hairline } from '@/components/Hairline';
import { useLogged } from '@/components/LoggedContext';
import { Notice } from '@/components/Notice';
import { Row } from '@/components/Row';
import { Text } from '@/components/Text';
import { useDelete } from '@/components/useDelete';
import { useFailedInView } from '@/components/useFailedInView';
import { totalsOf, type Totals as DayTotals } from '@/domain/dailyLog';
import { shownName } from '@/domain/shownName';
import { useToday } from '@/lifecycle/useToday';
import type { LoggedEntry } from '@/storage/EntryStore';
import { useEntryStore } from '@/storage/EntryStoreContext';
import { useReading } from '@/storage/useReading';

const PROTEIN_SET = { ...FIGURE_SET, weighed: 'font-language text-ink-mid' };

function Totals({ totals }: { totals: DayTotals }) {
  const { calories, caloriesKind, protein, proteinKind, spoken } = totalsWords(totals);
  return (
    <View
      accessible
      accessibilityLabel={`${spoken} today`}
      className="rounded-card bg-surface p-grid-2"
    >
      <Text className={`text-title ${FIGURE_SET[caloriesKind]}`}>{calories}</Text>
      <Text className={`text-label ${PROTEIN_SET[proteinKind]}`}>{protein}</Text>
    </View>
  );
}

function DayHeading({ day, count, totals }: { day: string; count: number; totals: DayTotals }) {
  const { shown, spoken } = tallyWords(count, totals);
  return (
    <View className="flex-row flex-wrap items-baseline justify-between gap-x-grid-2 pt-grid-1">
      <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
        {`Today · ${dayWords(day)}`}
      </Text>
      <Text accessibilityLabel={spoken} className="font-language text-label text-ink-mid">
        {shown}
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
  const faultInView = useFailedInView(shown, deletion.fault);
  return (
    <SafeAreaView className="flex-1 bg-ground" edges={['top']}>
      <FlatList
        {...faultInView.list}
        data={shown}
        ListFooterComponent={
          listed.length > LAST ? (
            <View className="pt-grid-2">
              <Button
                label={all ? 'Show less' : `Show all ${listed.length}`}
                onPress={() => setAll(!all)}
                secondary
              />
            </View>
          ) : undefined
        }
        keyExtractor={({ id }) => String(id)}
        renderItem={({ item }) => {
          const name = shownName(item.name);
          const words = entryWords(name, item);
          return (
            <DeletableRow
              ref={item.id === deletion.fault?.id ? faultInView.row : undefined}
              name={words.spoken}
              onDelete={() => void deletion.begin(item)}
              fault={item.id === deletion.fault?.id ? deletion.fault.why : undefined}
            >
              <Row name={name} {...words} />
            </DeletableRow>
          );
        }}
        contentContainerClassName="px-page pb-grid-2"
        ItemSeparatorComponent={Hairline}
        ListEmptyComponent={
          Array.isArray(found) ? (
            <Notice
              title="Nothing logged yet"
              action="Log"
              onAction={() => router.navigate('/log')}
            />
          ) : undefined
        }
        ListHeaderComponent={
          <View className="gap-grid-2 pb-grid-1">
            <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
              Today
            </Text>
            {found === 'unreadable' ? (
              <Notice title="Couldn’t load today’s summary" action="Retry" onAction={readAgain} />
            ) : null}
            {Array.isArray(found) ? <Totals totals={totals} /> : null}
            {listed.length > 0 ? (
              <DayHeading day={day} count={listed.length} totals={totals} />
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}
