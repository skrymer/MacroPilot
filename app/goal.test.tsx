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

  it('opens filled with the goal set when it is to be changed', async () => {
    // Given a goal of 75 kg at 0.5 kg a week set, and Profile open
    const stores = await setUp();
    await stores.goals.save({ setOn: '2026-11-27', startKg: 83, targetKg: 75, rateKgPerWeek: 0.5 });
    await openApp('/profile', stores);
    const user = userEvent.setup();

    // When the user asks to change it
    await user.press(await screen.findByRole('button', { name: 'Change goal' }));

    // Then the form holds its target and rate
    await waitFor(() => expect(screen.queryByDisplayValue('75')).toBeOnTheScreen());
    expect(screen.getByDisplayValue('0.5')).toBeOnTheScreen();
  });

  it('keeps what was typed when the save fails, and says so above the button', async () => {
    // Given the form filled over a goal store that cannot be written
    const stores = await setUp();
    stores.goals.unwritable = true;
    await openApp('/goal', stores);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Target weight (kg)'), '75');
    await user.type(screen.getByLabelText('Rate (kg a week)'), '0,5');

    // When the user sets it
    await user.press(screen.getByRole('button', { name: 'Set goal' }));

    // Then the form stays, filled, and says it was not set
    expect(
      await screen.findByText('Could not set goal. What you typed is still here.'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Target weight (kg)')).toHaveDisplayValue('75');
    expect(screen.getByLabelText('Rate (kg a week)')).toHaveDisplayValue('0,5');
  });

  it('says what Setup needs when it is opened before there can be a goal', async () => {
    // Given details saved but no weight logged, so no review
    const stores = {
      ...(await setUp()),
      weighIns: new InMemoryWeighInStore(),
      reviews: new InMemoryReviewStore(),
    };

    // When the goal form is opened, as by a link
    await openApp('/goal', stores);

    // Then it says what to do first, and offers no field
    await waitFor(() =>
      expect(
        screen.queryByText('Save your details and log your weight on Today to set a goal.'),
      ).toBeOnTheScreen(),
    );
    expect(screen.queryByLabelText('Target weight (kg)')).not.toBeOnTheScreen();
  });

  it('says it could not load the goal, with a way to try again, when the read fails', async () => {
    // Given Setup complete over a goal store that cannot be read
    const stores = await setUp();
    stores.goals.unreadable = true;

    // When the goal form is opened
    await openApp('/goal', stores);

    // Then it says so and offers to retry, and no field is shown
    await waitFor(() => expect(screen.queryByText('Couldn’t load your goal')).toBeOnTheScreen());
    expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();
    expect(screen.queryByLabelText('Target weight (kg)')).not.toBeOnTheScreen();
  });

  it('says it could not load, with a way to try again, when the weigh-ins cannot be read', async () => {
    // Given Setup complete over a weigh-in store that cannot be read
    const stores = await setUp();
    stores.weighIns.unreadable = true;

    // When the goal form is opened
    await openApp('/goal', stores);

    // Then it says so and offers to retry, and no field is shown
    await waitFor(() => expect(screen.queryByText('Couldn’t load your goal')).toBeOnTheScreen());
    expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();
    expect(screen.queryByLabelText('Target weight (kg)')).not.toBeOnTheScreen();
  });

  it('says it could not load, with a way to try again, when the reviews cannot be read', async () => {
    // Given Setup complete over a review store that cannot be read
    const stores = await setUp();
    stores.reviews.unreadable = true;

    // When the goal form is opened
    await openApp('/goal', stores);

    // Then it says so and offers to retry, and no field is shown
    await waitFor(() => expect(screen.queryByText('Couldn’t load your goal')).toBeOnTheScreen());
    expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();
    expect(screen.queryByLabelText('Target weight (kg)')).not.toBeOnTheScreen();
  });

  it('reads again on Retry, and shows the form once the goal can be read', async () => {
    // Given the form opened over a goal store that could not be read, and since can be
    const stores = await setUp();
    stores.goals.unreadable = true;
    await openApp('/goal', stores);
    const user = userEvent.setup();
    const retry = await screen.findByRole('button', { name: 'Retry' });
    stores.goals.unreadable = false;

    // When the user retries
    await user.press(retry);

    // Then the form is shown
    expect(await screen.findByLabelText('Target weight (kg)')).toBeOnTheScreen();
  });

  it('goes back to Profile on Cancel when opened before there can be a goal', async () => {
    // Given the goal form opened before any weight is logged
    const stores = {
      ...(await setUp()),
      weighIns: new InMemoryWeighInStore(),
      reviews: new InMemoryReviewStore(),
    };
    await openApp('/goal', stores);
    const user = userEvent.setup();
    const cancel = await screen.findByRole('button', { name: 'Cancel' });

    // When the user cancels
    await user.press(cancel);

    // Then Profile is shown
    expect(await screen.findByLabelText('Sex, Male')).toBeOnTheScreen();
  });

  it('says what Setup needs when a weight is logged but there is no review yet', async () => {
    // Given a weight logged today but no review, as before the details are saved
    const stores = { ...(await setUp()), reviews: new InMemoryReviewStore() };

    // When the goal form is opened, as by a link
    await openApp('/goal', stores);

    // Then it says what to do first, and offers no field
    await waitFor(() =>
      expect(
        screen.queryByText('Save your details and log your weight on Today to set a goal.'),
      ).toBeOnTheScreen(),
    );
    expect(screen.queryByLabelText('Target weight (kg)')).not.toBeOnTheScreen();
  });

  it('goes back to Profile on Cancel when the goal could not be read', async () => {
    // Given the goal form opened over a goal store that cannot be read
    const stores = await setUp();
    stores.goals.unreadable = true;
    await openApp('/goal', stores);
    const user = userEvent.setup();
    const cancel = await screen.findByRole('button', { name: 'Cancel' });

    // When the user cancels
    await user.press(cancel);

    // Then Profile is shown
    expect(await screen.findByLabelText('Sex, Male')).toBeOnTheScreen();
  });

  it('asks for a target and a rate when they are left blank, and sets nothing', async () => {
    // Given the form with nothing typed
    const stores = await setUp();
    await openApp('/goal', stores);
    const user = userEvent.setup();
    await screen.findByLabelText('Target weight (kg)');

    // When the user sets it
    await user.press(screen.getByRole('button', { name: 'Set goal' }));

    // Then each field says what it needs, and no Goal is kept
    expect(await screen.findByText('Enter a target weight')).toBeOnTheScreen();
    expect(screen.getByText('Enter a weekly rate')).toBeOnTheScreen();
    expect(await stores.goals.read()).toBeUndefined();
  });

  it('says why a target is refused as soon as the field is left', async () => {
    // Given the form, with a target above the trend typed
    await openApp('/goal', await setUp());
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Target weight (kg)'), '90');

    // When the user moves on to the rate
    await user.press(screen.getByLabelText('Rate (kg a week)'));

    // Then the target says why, before anything is set
    expect(
      await screen.findByText(
        'A weight-loss goal needs a target below your current trend weight (82.4 kg)',
      ),
    ).toBeOnTheScreen();
  });

  it('re-runs today’s review, so today’s budget drops by the goal’s deficit at once', async () => {
    // Given Setup complete, and the form with a goal of 75 kg at 0.5 kg a week (550 kcal a day)
    const stores = await setUp();
    await openApp('/goal', stores);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Target weight (kg)'), '75');
    await user.type(screen.getByLabelText('Rate (kg a week)'), '0,5');

    // When the user sets it
    await user.press(screen.getByRole('button', { name: 'Set goal' }));

    // Then today's review is run again, its budget 550 kcal under maintenance
    await waitFor(async () => {
      const [today] = await stores.reviews.list();
      expect(today?.budgetKcal).toBeCloseTo((today?.maintenanceKcal ?? 0) - 550, 6);
    });
  });
});
