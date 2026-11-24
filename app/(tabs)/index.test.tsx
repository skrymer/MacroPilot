import { screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { TestProviders } from '@/components/TestProviders';
import { weighedEntry } from '@/domain/entry';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { InMemoryEntryStore } from '@/storage/InMemoryEntryStore';

import Today from './index';

const OATS = { id: 1, name: 'rolled OATS', macros: { protein: 13, carbohydrate: 20, fat: 18 } };
const COFFEE = { id: 2, name: 'coffee', macros: { protein: 0, carbohydrate: 0, fat: 0 } };

/** Noon on 24 November 2026, on a phone in UTC. */
const atNoon = () => {
  const clock = new ScriptedClock();
  clock.advance(Date.UTC(2026, 10, 24, 12));
  return clock;
};

/** Opens the app on Today, over `entries`. */
const openToday = (entries: InMemoryEntryStore, clock = atNoon()) =>
  renderRouter(
    { '(tabs)/index': Today },
    {
      initialUrl: '/',
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders clock={clock} entries={entries}>
          {children}
        </TestProviders>
      ),
    },
  );

describe('Today', () => {
  it('says what the day adds up to, and what is in it', async () => {
    // Given three entries logged today, and one yesterday
    const entries = new InMemoryEntryStore([OATS, COFFEE]);
    await entries.add(weighedEntry(OATS, 500, '2026-11-23'));
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    await entries.add(weighedEntry(COFFEE, 250, '2026-11-24'));
    await entries.add(weighedEntry(OATS, 20, '2026-11-24'));

    // When the user opens Today
    await openToday(entries);

    // Then the totals are today's sums, and each entry of today has its own figures, zeros too
    expect(
      await screen.findByLabelText('294 calories, 13 grams of protein today'),
    ).toBeOnTheScreen();
    expect(screen.getByText('294 kcal')).toBeOnTheScreen();
    expect(screen.getByText('13 g protein')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Rolled oats, 80 grams, 235 calories, 10 grams of protein'),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Coffee, 250 grams, 0 calories, 0 grams of protein'),
    ).toBeOnTheScreen();
    expect(screen.getByText('250 g, 0 g protein')).toBeOnTheScreen();
    expect(screen.getByText('0 kcal')).toBeOnTheScreen();
    expect(screen.getByText('59 kcal')).toBeOnTheScreen();
    expect(screen.queryByText('Nothing logged yet')).not.toBeOnTheScreen();
  });

  it('says an empty day is known zeros, and offers Log', async () => {
    // Given nothing logged today
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 500, '2026-11-23'));

    // When the user opens Today
    await openToday(entries);

    // Then it says 0 of each, that nothing is logged, and the way to log
    expect(await screen.findByText('Nothing logged yet')).toBeOnTheScreen();
    expect(screen.getByText('0 kcal')).toBeOnTheScreen();
    expect(screen.getByText('0 g protein')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Log' })).toBeOnTheScreen();
    expect(screen.queryByText('Today could not be read')).not.toBeOnTheScreen();
  });

  it('says it could not read the day, rather than that it is empty, and reads it when asked', async () => {
    // Given Today open on a day that could not be read, and now can be
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    entries.unreadable = true;
    await openToday(entries);
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });
    expect(screen.getByText('Today could not be read')).toBeOnTheScreen();
    expect(screen.queryByText('Nothing logged yet')).not.toBeOnTheScreen();
    expect(screen.queryByText(/kcal/)).not.toBeOnTheScreen();
    entries.unreadable = false;

    // When the user tries again
    await userEvent.press(tryAgain);

    // Then the day is there, and nothing says it could not be read
    expect(await screen.findByText('Rolled oats')).toBeOnTheScreen();
    expect(screen.queryByText('Today could not be read')).not.toBeOnTheScreen();
  });
});
