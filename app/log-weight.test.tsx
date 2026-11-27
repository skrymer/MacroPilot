import { screen, userEvent } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { TestProviders } from '@/components/TestProviders';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
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
const openApp = (initialUrl: string, weighIns: InMemoryWeighInStore, clock = onTheDay()) =>
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
        <TestProviders weighIns={weighIns} clock={clock}>
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
