import { screen, userEvent, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { TestProviders } from '@/components/TestProviders';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { InMemoryEntryStore } from '@/storage/InMemoryEntryStore';
import { InMemoryReviewStore } from '@/storage/InMemoryReviewStore';

import LogEstimate from './log-estimate';

/** A clock on 28 November 2026, at noon in UTC. */
const onTheDay = () => {
  const clock = new ScriptedClock();
  clock.advance(Date.UTC(2026, 10, 28, 12));
  return clock;
};

/** 1520 kcal logged today, and today's review of a budget of 1840 kcal. */
const aDay = async () => {
  const entries = new InMemoryEntryStore();
  await entries.add({ day: '2026-11-28', label: 'Lunch', calories: 1520, protein: 40 });
  const reviews = new InMemoryReviewStore();
  await reviews.save({
    day: '2026-11-28',
    trendKg: 82,
    maintenanceKcal: 2390,
    budgetKcal: 1840,
    proteinFloorG: 164,
  });
  return { entries, reviews };
};

/** Opens the estimate form over the stores given. */
const openEstimate = (stores: Awaited<ReturnType<typeof aDay>>) =>
  renderRouter(
    { _layout: () => <Stack />, 'log-estimate': LogEstimate },
    {
      initialUrl: '/log-estimate',
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders {...stores} clock={onTheDay()}>
          {children}
        </TestProviders>
      ),
    },
  );

describe('The estimate form’s over line', () => {
  it('says how far past the budget the estimate would put the day', async () => {
    // Given 1520 kcal logged against a budget of 1840, and the estimate form open
    await openEstimate(await aDay());
    const user = userEvent.setup();

    // When 400 kcal is typed, the day at 1920
    await user.type(await screen.findByLabelText('Calories'), '400');

    // Then the line says the day would be about 80 kcal over its 1840 kcal budget
    await waitFor(() =>
      expect(
        screen.queryByText(/^This puts you about 80\skcal over your 1840\skcal budget\.$/),
      ).toBeOnTheScreen(),
    );
  });
});
