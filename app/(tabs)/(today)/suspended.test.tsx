import { screen, userEvent, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { TestProviders } from '@/components/TestProviders';
import { Text } from '@/components/Text';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { InMemoryEntryStore } from '@/storage/InMemoryEntryStore';
import { InMemoryGoalStore } from '@/storage/InMemoryGoalStore';
import { InMemoryReviewStore } from '@/storage/InMemoryReviewStore';

import Today from './index';

/** Noon on 28 November 2026, on a phone in UTC. */
const atNoon = () => {
  const clock = new ScriptedClock();
  clock.advance(Date.UTC(2026, 10, 28, 12));
  return clock;
};

/**
 * Today's review of a maintenance of 1535 kcal, and a Goal of `rate` kg a week: at 1.4 (1540 kcal a
 * day) the deficit is suspended and the budget is the maintenance; at 0.5 (550) it is taken.
 */
const aDay = async (rate: number) => {
  const reviews = new InMemoryReviewStore();
  const suspended = rate * 1100 >= 1535;
  await reviews.save({
    day: '2026-11-28',
    trendKg: 47,
    maintenanceKcal: 1535,
    budgetKcal: suspended ? 1535 : 1535 - rate * 1100,
    proteinFloorG: 94,
  });
  const goals = new InMemoryGoalStore();
  await goals.save({ setOn: '2026-11-20', startKg: 50, targetKg: 45, rateKgPerWeek: rate });
  return { reviews, goals, entries: new InMemoryEntryStore() };
};

/** Opens the app on Today, over the stores given. */
const openToday = (stores: Awaited<ReturnType<typeof aDay>>) =>
  renderRouter(
    {
      '(tabs)/(today)/index': Today,
      '(tabs)/(log)/log': () => null,
      '(tabs)/(profile)/profile': () => <Text>Profile, as the tab shows it</Text>,
    },
    {
      initialUrl: '/',
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders {...stores} clock={atNoon()}>
          {children}
        </TestProviders>
      ),
    },
  );

describe('Today, while the Goal’s deficit is suspended', () => {
  it('says no deficit is being applied, above the ring', async () => {
    // Given a Goal of 1.4 kg a week, a deficit today's maintenance of 1535 kcal cannot carry
    const stores = await aDay(1.4);

    // When the user opens Today
    await openToday(stores);

    // Then a card says so, in the reference app's words
    await waitFor(() =>
      expect(screen.queryByText('No deficit is being applied')).toBeOnTheScreen(),
    );
    expect(
      screen.getByText(
        'Your goal’s rate needs more of a daily deficit than your maintenance can give, so MacroPilot isn’t applying one. Your calorie budget below is your full maintenance — you’re holding steady, not losing.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Ease your goal' })).toBeOnTheScreen();
  });

  it('shows the card only once the targets are read, the goal read first', async () => {
    // Given the Goal readable at once, and today's review slow to be read
    const stores = await aDay(1.4);
    const release = stores.reviews.holdReads();
    await openToday(stores);

    // When the review comes in
    await screen.findByText('Log a weighed food, or an estimate.');
    release();

    // Then the card is shown, and nothing broke before it
    expect(await screen.findByText('No deficit is being applied')).toBeOnTheScreen();
  });

  it('says nothing of the budget below when there is no ring, the day unread', async () => {
    // Given the Goal's deficit suspended, and today's entries that cannot be read
    const stores = await aDay(1.4);
    stores.entries.unreadable = true;

    // When the user opens Today
    await openToday(stores);

    // Then the day's failure is said, and no card speaks of a budget below
    await screen.findByText('Couldn’t load today’s summary');
    expect(screen.queryByText('No deficit is being applied')).not.toBeOnTheScreen();
  });

  it('opens Profile from Ease your goal', async () => {
    // Given the card on Today, the Goal's deficit suspended
    await openToday(await aDay(1.4));
    const user = userEvent.setup();

    // When the user asks to ease the goal
    await user.press(await screen.findByRole('button', { name: 'Ease your goal' }));

    // Then Profile is showing
    expect(await screen.findByText('Profile, as the tab shows it')).toBeOnTheScreen();
  });
});
