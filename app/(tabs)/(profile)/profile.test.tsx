import { act, screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { TestProviders } from '@/components/TestProviders';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { InMemoryGoalStore } from '@/storage/InMemoryGoalStore';
import { InMemoryProfileStore } from '@/storage/InMemoryProfileStore';
import { InMemoryReviewStore } from '@/storage/InMemoryReviewStore';
import { InMemoryWeighInStore } from '@/storage/InMemoryWeighInStore';

import TabsLayout from '../_layout';
import ProfileStack from './_layout';
import Profile from './profile';

/** Noon on 28 November 2026, on a phone in UTC. */
const onTheDay = () => {
  const clock = new ScriptedClock();
  clock.advance(Date.UTC(2026, 10, 28, 12));
  return clock;
};

/** A review of the 28th: 82 kg, 2529 kcal of maintenance and budget, a floor of 164 g. */
const REVIEW = {
  day: '2026-11-28',
  trendKg: 82,
  maintenanceKcal: 2528.75,
  budgetKcal: 2528.75,
  proteinFloorG: 164,
};

/** Opens the app on Profile, over `profile`, and the weigh-ins, reviews and Goal given. */
const openProfile = (
  profile: InMemoryProfileStore,
  weighIns?: InMemoryWeighInStore,
  reviews?: InMemoryReviewStore,
  goals?: InMemoryGoalStore,
) =>
  renderRouter(
    {
      '(tabs)/_layout': TabsLayout,
      '(tabs)/(today)/index': () => null,
      '(tabs)/(log)/log': () => null,
      '(tabs)/(foods)/foods': () => null,
      '(tabs)/(profile)/_layout': ProfileStack,
      '(tabs)/(profile)/profile': Profile,
      '(tabs)/developer': () => null,
    },
    {
      initialUrl: '/profile',
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders
          profile={profile}
          weighIns={weighIns}
          reviews={reviews}
          goals={goals}
          clock={onTheDay()}
        >
          {children}
        </TestProviders>
      ),
    },
  );

describe('Profile’s goal card', () => {
  it('says what to do before Setup, and offers no way to set a goal', async () => {
    // Given details saved and no weight logged
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });

    // When the user opens Profile
    await openProfile(profile, new InMemoryWeighInStore());

    // Then the goal card says what Setup needs, with no button
    await screen.findByLabelText('Sex, Male');
    expect(
      screen.queryByText('Save your details and log your weight on Today to set a goal.'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Set a goal' })).not.toBeOnTheScreen();
  });

  it('says the budget is maintenance with no goal, and offers to set one', async () => {
    // Given details, today's weight and today's review of 2529 kcal, and no Goal
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1996-11-28', heightCm: 181, countsCalories: true });
    const weighIns = new InMemoryWeighInStore();
    await weighIns.save({ day: '2026-11-28', kg: 82 });
    const reviews = new InMemoryReviewStore();
    await reviews.save(REVIEW);

    // When the user opens Profile
    await openProfile(profile, weighIns, reviews);

    // Then the card says the budget is maintenance, and offers a goal
    await screen.findByLabelText('Sex, Male');
    expect(
      screen.queryByText(
        /^You’re maintaining: your budget is your maintenance, 2529\skcal a day\.$/,
      ),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Set a goal' })).toBeOnTheScreen();
  });

  it('shows the goal set: start to target, and its rate and deficit', async () => {
    // Given Setup complete, and a goal of 75 kg at 0.5 kg a week set from 82 kg
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1996-11-28', heightCm: 181, countsCalories: true });
    const weighIns = new InMemoryWeighInStore();
    await weighIns.save({ day: '2026-11-28', kg: 82 });
    const reviews = new InMemoryReviewStore();
    await reviews.save(REVIEW);
    const goals = new InMemoryGoalStore();
    await goals.save({ setOn: '2026-11-28', startKg: 82, targetKg: 75, rateKgPerWeek: 0.5 });

    // When the user opens Profile
    await openProfile(profile, weighIns, reviews, goals);

    // Then the card shows it, with a way to change it
    expect(await screen.findByText(/^82\.0 → 75\.0\skg$/)).toBeOnTheScreen();
    expect(
      screen.getByText(/^0\.5\skg a week, 550\skcal a day under maintenance$/),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Change goal' })).toBeOnTheScreen();
  });

  it('shows a rate typed with many decimals to two places, as the reference app does', async () => {
    // Given Setup complete, and a goal at 0.123456789 kg a week (136 kcal a day)
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1996-11-28', heightCm: 181, countsCalories: true });
    const weighIns = new InMemoryWeighInStore();
    await weighIns.save({ day: '2026-11-28', kg: 82 });
    const reviews = new InMemoryReviewStore();
    await reviews.save(REVIEW);
    const goals = new InMemoryGoalStore();
    await goals.save({
      setOn: '2026-11-28',
      startKg: 82,
      targetKg: 75,
      rateKgPerWeek: 0.123456789,
    });

    // When the user opens Profile
    await openProfile(profile, weighIns, reviews, goals);

    // Then the rate reads 0.12 kg a week
    expect(
      await screen.findByText(/^0\.12\skg a week, 136\skcal a day under maintenance$/),
    ).toBeOnTheScreen();
  });

  it('reads the goal again on Retry, and shows the card once it can be read', async () => {
    // Given Profile opened over a goal store that could not be read, and since can be
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1996-11-28', heightCm: 181, countsCalories: true });
    const weighIns = new InMemoryWeighInStore();
    await weighIns.save({ day: '2026-11-28', kg: 82 });
    const reviews = new InMemoryReviewStore();
    await reviews.save(REVIEW);
    const goals = new InMemoryGoalStore();
    goals.unreadable = true;
    await openProfile(profile, weighIns, reviews, goals);
    const user = userEvent.setup();
    const retry = await screen.findByRole('button', { name: 'Retry' });
    goals.unreadable = false;

    // When the user retries
    await user.press(retry);

    // Then the card offers to set a goal
    expect(await screen.findByRole('button', { name: 'Set a goal' })).toBeOnTheScreen();
  });

  it('says the goal could not be read, with a way to try again, and still shows the details', async () => {
    // Given Setup complete over a goal store that cannot be read
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1996-11-28', heightCm: 181, countsCalories: true });
    const weighIns = new InMemoryWeighInStore();
    await weighIns.save({ day: '2026-11-28', kg: 82 });
    const reviews = new InMemoryReviewStore();
    await reviews.save(REVIEW);
    const goals = new InMemoryGoalStore();
    goals.unreadable = true;

    // When the user opens Profile
    await openProfile(profile, weighIns, reviews, goals);

    // Then the goal card says so and offers to retry, above the details
    await screen.findByLabelText('Sex, Male');
    expect(screen.queryByText('Couldn’t load your goal')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();
  });
});

describe('Profile', () => {
  it('says what to add before there are any details, and never shows an empty form', async () => {
    // Given no profile saved
    const profile = new InMemoryProfileStore();

    // When the user opens Profile
    await openProfile(profile);

    // Then it says what the details are for, and the way to add them
    expect(await screen.findByText('No details yet')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Your sex, birth date and height set your first calorie budget and protein floor.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add your details' })).toBeOnTheScreen();
    expect(screen.queryByLabelText('Height (cm)')).not.toBeOnTheScreen();
  });

  it('says nothing before the profile is read, not even that there is none', async () => {
    // Given a profile saved, whose read has not come back
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    const release = profile.holdNextRead();

    // When the user opens Profile
    await openProfile(profile);

    // Then it says nothing until the read comes back with the details
    expect(await screen.findByRole('header', { name: 'Profile' })).toBeOnTheScreen();
    expect(screen.queryByText('No details yet')).not.toBeOnTheScreen();
    await act(async () => release());
    expect(await screen.findByLabelText('Sex, Male')).toBeOnTheScreen();
  });

  it('says a profile that cannot be read could not be, and reads it again when asked', async () => {
    // Given a profile saved in a store that cannot be read, and Profile open on it
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    profile.unreadable = true;
    await openProfile(profile);
    expect(await screen.findByText('Couldn’t load your profile')).toBeOnTheScreen();
    expect(screen.queryByText('No details yet')).not.toBeOnTheScreen();
    profile.unreadable = false;

    // When the user asks to try again
    await userEvent.press(screen.getByRole('button', { name: 'Retry' }));

    // Then the details are shown
    expect(await screen.findByLabelText('Sex, Male')).toBeOnTheScreen();
  });

  it('writes the birth date with its month short, as dates are written across the app', async () => {
    // Given a profile born in September
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1990-09-03', heightCm: 181, countsCalories: true });

    // When the user opens Profile
    await openProfile(profile);

    // Then the date reads 3 Sept 1990
    expect(await screen.findByText('3 Sept 1990')).toBeOnTheScreen();
  });

  it('shows a saved profile as rows under its heading, each read out as one', async () => {
    // Given a profile saved
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });

    // When the user opens Profile
    await openProfile(profile);

    // Then each detail is a row, and the way to change them is under them
    expect(await screen.findByRole('header', { name: 'Your details' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Sex, Male')).toBeOnTheScreen();
    expect(screen.getByLabelText('Birth date, 14 Mar 1984')).toBeOnTheScreen();
    expect(screen.getByLabelText('Height, 181 centimetres')).toBeOnTheScreen();
    expect(screen.getByLabelText('Calorie tracking, Calories and weight')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Change details' })).toBeOnTheScreen();
    expect(screen.queryByText('No details yet')).not.toBeOnTheScreen();
  });
});
