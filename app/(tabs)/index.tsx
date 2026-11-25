import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { entryWords, totalsWords } from '@/components/entryWords';
import { FIGURE_SET } from '@/components/figureSet';
import { Hairline } from '@/components/Hairline';
import { Notice } from '@/components/Notice';
import { Row } from '@/components/Row';
import { Text } from '@/components/Text';
import { totalsOf } from '@/domain/dailyLog';
import { shownName } from '@/domain/shownName';
import { useClock, useNow } from '@/lifecycle/ClockContext';
import { dayAt } from '@/lifecycle/dayAt';
import type { LoggedEntry } from '@/storage/EntryStore';
import { useEntryStore } from '@/storage/EntryStoreContext';
import { useReading } from '@/storage/useReading';

function EntryRow({ entry }: { entry: LoggedEntry }) {
  const name = shownName(entry.name);
  return <Row name={name} {...entryWords(name, entry)} />;
}

const PROTEIN_SET = { ...FIGURE_SET, weighed: 'font-language text-ink-mid' };

function Totals({ entries }: { entries: LoggedEntry[] }) {
  const { calories, caloriesKind, protein, proteinKind, spoken } = totalsWords(totalsOf(entries));
  return (
    <View accessible accessibilityLabel={`${spoken} today`} className="rounded-2xl bg-surface p-4">
      <Text className={`text-title ${FIGURE_SET[caloriesKind]}`}>{calories}</Text>
      <Text className={`text-label ${PROTEIN_SET[proteinKind]}`}>{protein}</Text>
    </View>
  );
}

export default function Today() {
  const router = useRouter();
  const store = useEntryStore();
  const clock = useClock();
  const now = useNow();
  const day = dayAt(clock, now);
  const list = useCallback(() => store.listOn(day), [store, day]);
  const { found, readAgain } = useReading(list);
  return (
    <SafeAreaView className="flex-1 bg-ground" edges={['top']}>
      <FlatList
        data={Array.isArray(found) ? found : []}
        keyExtractor={({ id }) => String(id)}
        renderItem={({ item }) => <EntryRow entry={item} />}
        contentContainerClassName="px-4 pb-4"
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
          <View className="gap-3 pb-3">
            <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
              Today
            </Text>
            {found === 'unreadable' ? (
              <Notice title="Couldn’t load today’s summary" action="Retry" onAction={readAgain} />
            ) : null}
            {Array.isArray(found) ? <Totals entries={found} /> : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}
