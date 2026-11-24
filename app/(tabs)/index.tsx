import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { grams, kcal, spokenGrams, spokenKcal } from '@/components/figures';
import { Hairline } from '@/components/Hairline';
import { Notice } from '@/components/Notice';
import { Row } from '@/components/Row';
import { Text } from '@/components/Text';
import { totalsOf } from '@/domain/dailyLog';
import { dayOf } from '@/domain/day';
import { shownName } from '@/domain/shownName';
import { useClock, useNow } from '@/lifecycle/ClockContext';
import type { LoggedEntry } from '@/storage/EntryStore';
import { useEntryStore } from '@/storage/EntryStoreContext';
import { useReading } from '@/storage/useReading';

function EntryRow({ entry }: { entry: LoggedEntry }) {
  const name = shownName(entry.name);
  return (
    <Row
      name={name}
      detail={`${grams(entry.grams)}, ${grams(entry.protein)} protein`}
      figure={kcal(entry.calories)}
      spoken={`${name}, ${spokenGrams(entry.grams)}, ${spokenKcal(entry.calories)}, ${spokenGrams(entry.protein)} of protein`}
    />
  );
}

function Totals({ entries }: { entries: LoggedEntry[] }) {
  const { calories, protein } = totalsOf(entries);
  return (
    <View
      accessible
      accessibilityLabel={`${spokenKcal(calories)}, ${spokenGrams(protein)} of protein today`}
      className="rounded-2xl bg-surface p-4"
    >
      <Text className="font-weighed text-title text-ink">{kcal(calories)}</Text>
      <Text className="font-language text-label text-ink-mid">{`${grams(protein)} protein`}</Text>
    </View>
  );
}

export default function Today() {
  const router = useRouter();
  const store = useEntryStore();
  const clock = useClock();
  const now = useNow();
  const day = dayOf(now, clock.utcOffsetMinutes(now));
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
              <Notice title="Today could not be read" action="Try again" onAction={readAgain} />
            ) : null}
            {Array.isArray(found) ? <Totals entries={found} /> : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}
