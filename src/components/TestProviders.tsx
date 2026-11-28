import { useEffect, useState, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ClockProvider } from '@/lifecycle/ClockContext';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { EntryStoreProvider } from '@/storage/EntryStoreContext';
import { FoodStoreProvider } from '@/storage/FoodStoreContext';
import { GoalStoreProvider } from '@/storage/GoalStoreContext';
import { InMemoryEntryStore } from '@/storage/InMemoryEntryStore';
import { InMemoryFoodStore } from '@/storage/InMemoryFoodStore';
import { InMemoryGoalStore } from '@/storage/InMemoryGoalStore';
import { InMemoryProfileStore } from '@/storage/InMemoryProfileStore';
import { InMemoryReviewStore } from '@/storage/InMemoryReviewStore';
import { InMemoryWeighInStore } from '@/storage/InMemoryWeighInStore';
import { ProfileStoreProvider } from '@/storage/ProfileStoreContext';
import { ReviewStoreProvider } from '@/storage/ReviewStoreContext';
import { WeighInStoreProvider } from '@/storage/WeighInStoreContext';

import { AskProvider } from './AskContext';
import { LoggedProvider } from './LoggedContext';
import { ScriptedAsk } from './ScriptedAsk';

/**
 * For screen tests: the providers the root layout gives every screen, over the fakes. Each has a
 * quiet default (a clock nobody moves, a store with nothing in it), so a test names only what it is
 * about.
 */
export function TestProviders({
  clock,
  foods,
  entries,
  profile,
  weighIns,
  reviews,
  goals,
  ask,
  children,
}: {
  clock?: ScriptedClock;
  foods?: InMemoryFoodStore;
  entries?: InMemoryEntryStore;
  profile?: InMemoryProfileStore;
  weighIns?: InMemoryWeighInStore;
  reviews?: InMemoryReviewStore;
  goals?: InMemoryGoalStore;
  ask?: ScriptedAsk;
  children: ReactNode;
}) {
  const [quietClock] = useState(() => new ScriptedClock());
  const [noFoods] = useState(() => new InMemoryFoodStore());
  const [noEntries] = useState(() => new InMemoryEntryStore());
  const [noProfile] = useState(() => new InMemoryProfileStore());
  const [noWeighIns] = useState(() => new InMemoryWeighInStore());
  const [noReviews] = useState(() => new InMemoryReviewStore());
  const [noGoal] = useState(() => new InMemoryGoalStore());
  const [unanswered] = useState(() => new ScriptedAsk());
  // The phone's two stores are tables of one database.
  useEffect(() => (foods ?? noFoods).loggedIn(entries ?? noEntries));
  return (
    <ClockProvider clock={clock ?? quietClock}>
      <FoodStoreProvider store={foods ?? noFoods}>
        <EntryStoreProvider store={entries ?? noEntries}>
          <ProfileStoreProvider store={profile ?? noProfile}>
            <WeighInStoreProvider store={weighIns ?? noWeighIns}>
              <ReviewStoreProvider store={reviews ?? noReviews}>
                <GoalStoreProvider store={goals ?? noGoal}>
                  <AskProvider ask={ask ?? unanswered}>
                    <LoggedProvider>
                      {/* The root's, as `app/_layout.tsx` gives it: a swipe is seen only under it. */}
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        {children}
                      </GestureHandlerRootView>
                    </LoggedProvider>
                  </AskProvider>
                </GoalStoreProvider>
              </ReviewStoreProvider>
            </WeighInStoreProvider>
          </ProfileStoreProvider>
        </EntryStoreProvider>
      </FoodStoreProvider>
    </ClockProvider>
  );
}
