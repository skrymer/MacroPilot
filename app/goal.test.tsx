import { screen, userEvent, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { TestProviders } from '@/components/TestProviders';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { InMemoryGoalStore } from '@/storage/InMemoryGoalStore';
import { InMemoryProfileStore } from '@/storage/InMemoryProfileStore';
import { InMemoryReviewStore } from '@/storage/InMemoryReviewStore';
import { InMemoryWeighInStore } from '@/storage/InMemoryWeighInStore';

import Profile from './(tabs)/(profile)/profile';
import Goal from './goal';

/** A clock on 28 November 2026, at noon in UTC. */
const onTheDay = () => {
  const clock = new ScriptedClock();
  clock.advance(Date.UTC(2026, 10, 28, 12));
  return clock;
};

/** Setup complete: a man of 30 and 181 cm, weighed at 82.4 kg today, and today's review of it. */
const setUp = async () => {
  const profile = new InMemoryProfileStore();
  await profile.save({ sex: 'male', born: '1996-11-28', heightCm: 181, countsCalories: true });
  const weighIns = new InMemoryWeighInStore();
  await weighIns.save({ day: '2026-11-28', kg: 82.4 });
  const reviews = new InMemoryReviewStore();
  await reviews.save({
    day: '2026-11-28',
    trendKg: 82.4,
    maintenanceKcal: 2534.35,
    budgetKcal: 2534.35,
    proteinFloorG: 164.8,
  });
  return { profile, weighIns, reviews, goals: new InMemoryGoalStore() };
};

/** Opens the app at `initialUrl`, over the stores given. */
const openApp = (initialUrl: string, stores: Awaited<ReturnType<typeof setUp>>) =>
  renderRouter(
    { _layout: () => <Stack />, '(tabs)/(profile)/profile': Profile, goal: Goal },
    {
      initialUrl,
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders {...stores} clock={onTheDay()}>
          {children}
        </TestProviders>
      ),
    },
  );

describe('The goal form', () => {
  it('opens from Profile, starting from the trend weight, shown and never typed', async () => {
    // Given Setup complete and no Goal, and Profile open
    await openApp('/profile', await setUp());
    const user = userEvent.setup();

    // When the user asks to set a goal
    await user.press(await screen.findByRole('button', { name: 'Set a goal' }));

    // Then the form starts from the trend, with fields for the target and the rate
    await waitFor(() =>
      expect(screen.queryByLabelText('Starting weight, 82.4 kilograms')).toBeOnTheScreen(),
    );
    expect(screen.getByText('your trend, smoothed from recent weigh-ins')).toBeOnTheScreen();
    expect(screen.getByLabelText('Target weight (kg)')).toBeOnTheScreen();
    expect(screen.getByLabelText('Rate (kg a week)')).toBeOnTheScreen();
  });

  it('sets the goal, from the trend weight, and Profile shows it', async () => {
    // Given Setup complete, and the form opened from Profile with a target and a rate typed
    const stores = await setUp();
    await openApp('/profile', stores);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Set a goal' }));
    await user.type(await screen.findByLabelText('Target weight (kg)'), '75');
    await user.type(screen.getByLabelText('Rate (kg a week)'), '0,5');

    // When the user sets it
    await user.press(screen.getByRole('button', { name: 'Set goal' }));

    // Then it is kept, from 82.4 kg today, and Profile shows it
    await waitFor(async () =>
      expect(await stores.goals.read()).toEqual({
        setOn: '2026-11-28',
        startKg: 82.4,
        targetKg: 75,
        rateKgPerWeek: 0.5,
      }),
    );
    expect(await screen.findByText(/^82\.4 → 75\.0\skg$/)).toBeOnTheScreen();
  });
});
