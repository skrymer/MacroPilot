import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { cm } from '@/components/figures';
import { Notice } from '@/components/Notice';
import { Text } from '@/components/Text';
import { Unreadable } from '@/components/Unreadable';
import type { Profile as Details } from '@/domain/profile';
import { useProfile } from '@/storage/useProfile';

const SEX = { male: 'Male', female: 'Female' } as const;

/** A birth date as `14 March 1984`, read as the day it names wherever the phone is. */
const dateWords = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

/** A label and what it holds, read out as one row of a card. */
function Detail({ label, value, spoken }: { label: string; value: string; spoken?: string }) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${spoken ?? value}`}
      className="min-h-target flex-row flex-wrap items-center justify-between gap-x-grid-2 py-grid-1"
    >
      <Text className="font-language text-body text-ink">{label}</Text>
      <Text className="font-language text-body text-ink-mid">{value}</Text>
    </View>
  );
}

function Saved({ details }: { details: Details }) {
  const router = useRouter();
  return (
    <>
      <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
        Your details
      </Text>
      <View className="rounded-card bg-surface px-grid-2">
        <Detail label="Sex" value={SEX[details.sex]} />
        <View className="border-t border-line" />
        <Detail label="Birth date" value={dateWords(details.born)} />
        <View className="border-t border-line" />
        <Detail
          label="Height"
          value={cm(details.heightCm)}
          spoken={`${details.heightCm} centimetres`}
        />
        <View className="border-t border-line" />
        <Detail
          label="Calorie tracking"
          value={details.countsCalories ? 'Calories and weight' : 'Weight only'}
        />
      </View>
      <Button label="Change details" onPress={() => router.navigate('/details')} secondary />
    </>
  );
}

export default function Profile() {
  const router = useRouter();
  const { profile: found, readAgain } = useProfile();
  const [details] = Array.isArray(found) ? found : [];
  return (
    // The page's root, or iOS's large title does not follow its scroll.
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-grid-2 px-page py-grid-2"
    >
      {found === 'unread' ? null : found === 'unreadable' ? (
        <Unreadable words="Couldn’t load your details" onRetry={() => void readAgain()} />
      ) : details ? (
        <Saved details={details} />
      ) : (
        <Notice
          title="No details yet"
          detail="Your sex, birth date and height set your first calorie budget and protein floor."
          action="Add your details"
          // Not `push`, which opens a second form over the first when it is pressed twice.
          onAction={() => router.navigate('/details')}
        />
      )}
    </ScrollView>
  );
}
