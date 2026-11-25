import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeletableRow } from '@/components/DeletableRow';
import { entryWords, entryFigures, totalsWords } from '@/components/entryWords';
import { FIGURE_SET } from '@/components/figureSet';
import { Hairline } from '@/components/Hairline';
import { Notice } from '@/components/Notice';
import { Row } from '@/components/Row';
import { Text } from '@/components/Text';
import { useDelete } from '@/components/useDelete';
import { useFailedInView } from '@/components/useFailedInView';
import { totalsOf } from '@/domain/dailyLog';
import { shownName } from '@/domain/shownName';
import { useClock, useNow } from '@/lifecycle/ClockContext';
import { dayAt } from '@/lifecycle/dayAt';
import type { LoggedEntry } from '@/storage/EntryStore';
import { useEntryStore } from '@/storage/EntryStoreContext';
import { useReading } from '@/storage/useReading';

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
  const deletion = useDelete<LoggedEntry>({
    title: 'Delete this entry?',
    message: (entry) =>
      `${shownName(entry.name)}, ${entryFigures(entry).shown} will be removed, and that day’s totals re-derive without it.`,
    remove: ({ id }) => store.delete(id),
    failed: 'Could not delete entry',
    onDeleted: readAgain,
  });
  const listed = Array.isArray(found) ? found : [];
  const faultInView = useFailedInView(listed, deletion.fault);
  return (
    <SafeAreaView className="flex-1 bg-ground" edges={['top']}>
      <FlatList
        {...faultInView.list}
        data={listed}
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
