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
});
