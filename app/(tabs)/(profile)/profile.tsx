import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { dateWords } from '@/components/DateField';
import { cm, kcal, kg, spokenCm } from '@/components/figures';
import { Hairline } from '@/components/Hairline';
import { Notice } from '@/components/Notice';
import { SEXES, TRACKING, wordsOf } from '@/components/profileWords';
import { Text } from '@/components/Text';
import { Unreadable } from '@/components/Unreadable';
import { dailyDeficit } from '@/domain/goal';
import type { Profile as Details } from '@/domain/profile';
import { reviewFor } from '@/domain/review';
import { useToday } from '@/lifecycle/useToday';
import { useGoal } from '@/storage/useGoal';
import { useProfile } from '@/storage/useProfile';
import { useReviews } from '@/storage/useReviews';

/** Joins a figure to its unit, so a line never breaks between them. */
const NBSP = String.fromCharCode(0xa0);

/** A label and what it holds, read out as one row of a card. */
function Detail({ label, value, spoken }: { label: string; value: string; spoken?: string }) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${spoken ?? value}`}
      className="min-h-target flex-row flex-wrap items-center justify-between gap-x-grid-2 px-grid-2 py-grid-1"
    >
      <Text className="font-language text-body text-ink">{label}</Text>
      <Text className="font-language text-body text-ink-mid">{value}</Text>
    </View>
  );
}

/** The Goal, above the details: what Setup needs before there can be one, or the way to set one. */
function GoalCard() {
  const router = useRouter();
  const today = useToday();
  const { reviews } = useReviews();
  const { goal: found, readAgain } = useGoal();
  if (found === 'unreadable') {
    return (
      <>
        <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
          Goal
        </Text>
        <Unreadable words="Couldn’t load your goal" onRetry={() => void readAgain()} />
      </>
    );
  }
  if (!Array.isArray(reviews) || !Array.isArray(found)) return null;
  // The review today is held to, which there is only once Setup is complete.
  const heldTo = reviewFor(reviews, today);
  const [goal] = found;
  return (
    <>
      <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
        Goal
      </Text>
      <View className="gap-grid-2 rounded-card bg-surface p-grid-2">
        {heldTo === undefined ? (
          <Text className="font-language text-body text-ink-mid">
            Save your details and log your weight on Today to set a goal.
          </Text>
        ) : goal ? (
          <>
            <View>
              <Text className="font-weighed text-title text-ink">
                {`${goal.startKg.toFixed(1)} → ${kg(goal.targetKg)}`}
              </Text>
              <Text className="font-language text-label text-ink-mid">
                {`${goal.rateKgPerWeek}${NBSP}kg a week, ${kcal(dailyDeficit(goal.rateKgPerWeek))} a day under maintenance`}
              </Text>
            </View>
            <Button label="Change goal" onPress={() => router.navigate('/goal')} secondary />
          </>
        ) : (
          <>
            <Text className="font-language text-body text-ink-mid">
              {`You’re maintaining: your budget is your maintenance, ${kcal(heldTo.maintenanceKcal)} a day.`}
            </Text>
            <Button label="Set a goal" onPress={() => router.navigate('/goal')} secondary />
          </>
        )}
      </View>
    </>
  );
}

function Saved({ details }: { details: Details }) {
  const router = useRouter();
  return (
    <>
      <GoalCard />
      <Text accessibilityRole="header" className="font-language-bold text-body text-ink">
        Your details
      </Text>
      <View className="overflow-hidden rounded-card bg-surface">
        <Detail label="Sex" value={wordsOf(SEXES, details.sex)} />
        <Hairline />
        <Detail label="Birth date" value={dateWords(details.born)} />
        <Hairline />
        <Detail label="Height" value={cm(details.heightCm)} spoken={spokenCm(details.heightCm)} />
        <Hairline />
        <Detail label="Calorie tracking" value={wordsOf(TRACKING, details.countsCalories)} />
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
        <Unreadable words="Couldn’t load your profile" onRetry={() => void readAgain()} />
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
