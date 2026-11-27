import { act, screen, userEvent, waitFor } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { TestProviders } from '@/components/TestProviders';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { InMemoryProfileStore } from '@/storage/InMemoryProfileStore';
import { InMemoryReviewStore } from '@/storage/InMemoryReviewStore';
import { InMemoryWeighInStore } from '@/storage/InMemoryWeighInStore';

import Today from './(tabs)/(today)/index';
import LogWeight from './log-weight';

/** A clock on 28 November 2026, at noon in UTC. */
const onTheDay = () => {
  const clock = new ScriptedClock();
  clock.advance(Date.UTC(2026, 10, 28, 12));
  return clock;
};

/** Opens the app at `initialUrl`, over `weighIns`. */
const openApp = (
  initialUrl: string,
  weighIns: InMemoryWeighInStore,
  clock = onTheDay(),
  profile?: InMemoryProfileStore,
  reviews?: InMemoryReviewStore,
) =>
  renderRouter(
    {
      _layout: () => <Stack />,
      '(tabs)/(today)/index': Today,
      '(tabs)/(log)/log': () => null,
      'log-weight': LogWeight,
    },
    {
      initialUrl,
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders weighIns={weighIns} clock={clock} profile={profile} reviews={reviews}>
          {children}
        </TestProviders>
      ),
    },
  );

describe('Log weight', () => {
  it.each([
    ['820', 'Enter a weight from 20 to 400 kg'],
    ['19,9', 'Enter a weight from 20 to 400 kg'],
    ['', 'Enter your weight in kg'],
  ])('refuses "%s" and keeps nothing', async (typed, why) => {
    // Given the form with a weight typed
    const weighIns = new InMemoryWeighInStore();
    await openApp('/log-weight', weighIns);
    const user = userEvent.setup();
    const field = await screen.findByLabelText('Weight (kg)');
    if (typed) await user.type(field, typed);

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save weight' }));

    // Then the field says why, and nothing is kept
    expect(await screen.findByText(why)).toBeOnTheScreen();
    expect(await weighIns.list()).toEqual([]);
  });

  it('says the weigh-ins could not be read, with the way out and a retry', async () => {
    // Given weigh-ins that cannot be read
    const weighIns = new InMemoryWeighInStore();
    weighIns.unreadable = true;

    // When the form opens
    await openApp('/log-weight', weighIns);

    // Then it says so, offers to leave, and to try again, which opens the form
    expect(await screen.findByText('Couldn’t load your weight')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeOnTheScreen();
    weighIns.unreadable = false;
    await userEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByLabelText('Weight (kg)')).toBeOnTheScreen();
  });

  it('opens from the setup line when details are saved and only a weigh-in is missing', async () => {
    // Given Today with details and no weigh-in
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    await openApp('/', new InMemoryWeighInStore(), onTheDay(), profile);
    const line = await screen.findByText('Log your weight to see your calorie budget');
    const [fromLine] = screen.getAllByRole('button', { name: 'Log weight' });

    // When the user presses the line's Log weight
    await userEvent.press(fromLine as NonNullable<typeof fromLine>);

    // Then the form is open, the line under it
    expect(await screen.findByLabelText('Weight (kg)')).toBeOnTheScreen();
    expect(line).toBeTruthy();
  });

  it('runs the first review when this weigh-in completes Setup, from the weight kept', async () => {
    // Given details saved, and the form opened from Today with a weight typed
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    const reviews = new InMemoryReviewStore();
    await openApp('/log-weight', new InMemoryWeighInStore(), onTheDay(), profile, reviews);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Weight (kg)'), '820');
    await user.press(screen.getByRole('button', { name: 'Save weight' }));
    await screen.findByText('Enter a weight from 20 to 400 kg');
    await user.clear(screen.getByLabelText('Weight (kg)'));
    await user.type(screen.getByLabelText('Weight (kg)'), '82');

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save weight' }));

    // Then today's review is set from it
    await waitFor(async () =>
      expect((await reviews.list()).map(({ day }) => day)).toEqual(['2026-11-28']),
    );
    expect((await reviews.list())[0]?.trendKg).toBe(82);
  });

  it('runs today’s review again when today’s weigh-in is replaced, a typo of 320 fixed to 82', async () => {
    // Given today's weigh-in typed as 320 kg in error (820 is refused), and today's review set from it
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    const weighIns = new InMemoryWeighInStore();
    await weighIns.save({ day: '2026-11-28', kg: 320 });
    const reviews = new InMemoryReviewStore();
    await reviews.save({
      day: '2026-11-28',
      trendKg: 320,
      maintenanceKcal: 5000,
      budgetKcal: 5000,
      proteinFloorG: 640,
    });
    await openApp('/log-weight', weighIns, onTheDay(), profile, reviews);
    const user = userEvent.setup();
    await user.clear(await screen.findByLabelText('Weight (kg)'));
    await user.type(screen.getByLabelText('Weight (kg)'), '82');

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save weight' }));

    // Then today's review is set again, from 82 kg
    await waitFor(async () => expect((await reviews.list())[0]?.trendKg).toBe(82));
    expect((await reviews.list()).map(({ day }) => day)).toEqual(['2026-11-28']);
  });

  it('shows the ring on Today though the user left before the first review landed', async () => {
    // Given details saved, the form over Today with a weight typed, and slow storage for reviews
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    const reviews = new InMemoryReviewStore();
    const release = reviews.holdWrites();
    await openApp('/', new InMemoryWeighInStore(), onTheDay(), profile, reviews);
    const user = userEvent.setup();
    const [logWeight] = await screen.findAllByRole('button', { name: 'Log weight' });
    await user.press(logWeight as NonNullable<typeof logWeight>);
    await user.type(await screen.findByLabelText('Weight (kg)'), '82');
    await user.press(screen.getByRole('button', { name: 'Save weight' }));

    // When the user goes back to Today at once, and then the review lands
    await act(() => router.back());
    await screen.findByLabelText('Weight today, 82.0 kilograms');
    await act(async () => release());

    // Then Today shows the ring
    expect(await screen.findByText('kcal left')).toBeOnTheScreen();
  });

  it('shows the weight on Today though the user left before its write landed', async () => {
    // Given the form over Today with a weight typed, over storage that is slow to write
    const weighIns = new InMemoryWeighInStore();
    const release = weighIns.holdWrites();
    await openApp('/', weighIns);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Log weight' }));
    await user.type(await screen.findByLabelText('Weight (kg)'), '75.3');
    await user.press(screen.getByRole('button', { name: 'Save weight' }));

    // When the user goes back to Today at once, and then the write lands
    await act(() => router.back());
    await screen.findByText('No weight logged today');
    await act(async () => release());

    // Then it is kept, and Today shows it
    await waitFor(async () => expect(await weighIns.list()).toHaveLength(1));
    expect(await screen.findByLabelText('Weight today, 75.3 kilograms')).toBeOnTheScreen();
  });

  it('keeps the day it was opened on, when midnight passes with it open', async () => {
    // Given a weigh-in on the 27th, opened from Edit at 23:59 and changed
    const weighIns = new InMemoryWeighInStore();
    await weighIns.save({ day: '2026-11-27', kg: 82.4 });
    const clock = new ScriptedClock();
    clock.advance(Date.UTC(2026, 10, 27, 23, 59));
    await openApp('/', weighIns, clock);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Edit today’s weight' }));
    const field = await screen.findByLabelText('Weight (kg)');
    await user.clear(field);
    await user.type(field, '81.9');

    // When midnight passes and the user saves it
    await act(async () => clock.advance(2 * 60_000));
    await user.press(screen.getByRole('button', { name: 'Save weight' }));

    // Then it replaces the 27th's, and the 28th has none
    await waitFor(async () =>
      expect(await weighIns.list()).toEqual([{ day: '2026-11-27', kg: 81.9 }]),
    );
  });

  it('leaves by its X when the weigh-ins could not be read', async () => {
    // Given the form over Today, its weigh-ins unreadable
    const weighIns = new InMemoryWeighInStore();
    weighIns.unreadable = true;
    await openApp('/', weighIns);
    await act(() => router.navigate('/log-weight'));
    await screen.findByRole('button', { name: 'Cancel' });

    // When the user leaves by the X
    await userEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    // Then the form is gone, its X with it
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeOnTheScreen(),
    );
  });

  it('keeps the weight typed when the save fails, and says so above the button', async () => {
    // Given the form with a weight typed, over a store that cannot be written
    const weighIns = new InMemoryWeighInStore();
    weighIns.unwritable = true;
    await openApp('/log-weight', weighIns);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Weight (kg)'), '82');

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save weight' }));

    // Then the form stays, filled, and says it was not saved
    expect(
      await screen.findByText('Could not save weight. What you typed is still here.'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Weight (kg)')).toHaveDisplayValue('82');
  });

  it('logs today’s weight from Today, and Today shows it', async () => {
    // Given Today with no weigh-in, and the form opened from its row with a weight typed
    const weighIns = new InMemoryWeighInStore();
    await openApp('/', weighIns);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Log weight' }));
    await user.type(await screen.findByLabelText('Weight (kg)'), '82,4');

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save weight' }));

    // Then Today shows it, and it is kept for today
    expect(await screen.findByLabelText('Weight today, 82.4 kilograms')).toBeOnTheScreen();
    expect(await weighIns.list()).toEqual([{ day: '2026-11-28', kg: 82.4 }]);
  });

  it('opens filled with today’s weight from Edit, and saving it again replaces it', async () => {
    // Given a weigh-in of 82.4 kg today, and the form opened from the row's Edit
    const weighIns = new InMemoryWeighInStore();
    await weighIns.save({ day: '2026-11-28', kg: 82.4 });
    await openApp('/', weighIns);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Edit today’s weight' }));
    const field = await screen.findByLabelText('Weight (kg)');
    expect(field).toHaveDisplayValue('82.4');
    await user.clear(field);
    await user.type(field, '81.9');

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save weight' }));

    // Then Today shows the new one, the only one today
    expect(await screen.findByLabelText('Weight today, 81.9 kilograms')).toBeOnTheScreen();
    expect(await weighIns.list()).toEqual([{ day: '2026-11-28', kg: 81.9 }]);
  });
});
