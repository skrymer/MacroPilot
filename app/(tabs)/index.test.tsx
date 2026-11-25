import { act, screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { ScriptedAsk } from '@/components/ScriptedAsk';
import { TestProviders } from '@/components/TestProviders';
import { estimatedEntry, weighedEntry } from '@/domain/entry';
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
const openToday = (entries: InMemoryEntryStore, clock = atNoon(), ask?: ScriptedAsk) =>
  renderRouter(
    { '(tabs)/index': Today, '(tabs)/log': () => null },
    {
      initialUrl: '/',
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders clock={clock} entries={entries} ask={ask}>
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

  it('tells an estimate from a weighed entry, its protein not stated or a figure', async () => {
    // Given a weighed entry, an estimate that states no protein, and one that states 0
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    await entries.add(estimatedEntry({ label: 'pub LUNCH', calories: 850 }, '2026-11-24'));
    await entries.add(estimatedEntry({ label: 'broth', calories: 0, protein: 0 }, '2026-11-24'));

    // When the user opens Today
    await openToday(entries);

    // Then each estimate says it is one, and what it knows of its protein, to the eye and the ear
    expect(await screen.findByText('about 850 kcal')).toBeOnTheScreen();
    expect(screen.getByText('Estimate, protein not stated')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Pub lunch, estimate, about 850 calories, protein not stated'),
    ).toBeOnTheScreen();
    expect(screen.getByText('about 0 kcal')).toBeOnTheScreen();
    expect(screen.getByText('Estimate, 0 g protein')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Broth, estimate, about 0 calories, 0 grams of protein'),
    ).toBeOnTheScreen();
    expect(screen.getByText('80 g, 10 g protein')).toBeOnTheScreen();
  });

  it.each([
    [
      'estimates alone, none with protein',
      [{ calories: 850 }, { calories: 150 }],
      'about 1000 kcal',
      'protein not stated',
      'About 1000 calories, protein not stated today',
    ],
    [
      'estimates alone, one with protein',
      [{ calories: 850, protein: 30 }, { calories: 150 }],
      'about 1000 kcal',
      'at least 30 g protein',
      'About 1000 calories, at least 30 grams of protein today',
    ],
    [
      'an estimate that states no protein beside one that states none of it',
      [{ calories: 850, protein: 0 }, { calories: 150 }],
      'about 1000 kcal',
      'at least 0 g protein',
      'About 1000 calories, at least 0 grams of protein today',
    ],
    [
      'estimates that all state it',
      [
        { calories: 850, protein: 30 },
        { calories: 150, protein: 0 },
      ],
      'about 1000 kcal',
      '30 g protein',
      'About 1000 calories, 30 grams of protein today',
    ],
  ])('says how sure a day of %s is', async (_, estimates, kcal, protein, spoken) => {
    // Given a day's estimates
    const entries = new InMemoryEntryStore();
    for (const estimate of estimates) {
      await entries.add(estimatedEntry({ label: 'lunch', ...estimate }, '2026-11-24'));
    }

    // When the user opens Today
    await openToday(entries);

    // Then its card says so, to the eye and the ear
    expect(await screen.findByLabelText(spoken)).toBeOnTheScreen();
    expect(screen.getByText(kcal)).toBeOnTheScreen();
    expect(screen.getByText(protein)).toBeOnTheScreen();
  });

  it('takes one weighed entry for a solid total, and protein that an estimate does not state for part', async () => {
    // Given a weighed entry, an estimate with protein and one without
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    await entries.add(estimatedEntry({ label: 'soup', calories: 200, protein: 8 }, '2026-11-24'));
    await entries.add(estimatedEntry({ label: 'lunch', calories: 850 }, '2026-11-24'));

    // When the user opens Today
    await openToday(entries);

    // Then its calories are not *about*, and its protein is *at least*
    expect(
      await screen.findByLabelText('1285 calories, at least 18 grams of protein today'),
    ).toBeOnTheScreen();
    expect(screen.getByText('1285 kcal')).toBeOnTheScreen();
    expect(screen.getByText('at least 18 g protein')).toBeOnTheScreen();
  });

  it('deletes the entry it asked about by its figures, and the totals follow', async () => {
    // Given Today open on two entries of one food, and the first asked to be deleted
    const entries = new InMemoryEntryStore([OATS]);
    for (const eaten of [80, 20]) {
      await entries.add(weighedEntry(OATS, eaten, '2026-11-24'));
    }
    const ask = new ScriptedAsk();
    await openToday(entries, atNoon(), ask);
    const name = 'Delete Rolled oats, 80 grams, 235 calories, 10 grams of protein';
    await userEvent.press(await screen.findByRole('button', { name }));
    const { title, message, loses } = ask.question ?? {};
    expect([title, loses]).toEqual(['Delete this entry?', 'Delete']);
    // A figure and its unit are joined by a no-break space.
    expect(message?.replace(/\s/g, ' ')).toBe(
      'Rolled oats, 80 g, 235 kcal, 10 g protein will be removed, and that day’s totals re-derive without it.',
    );

    // When the user says to
    await act(async () => ask.answer(true));

    // Then it alone is gone, and the day is what is left
    expect(await screen.findByText('20 g, 3 g protein')).toBeOnTheScreen();
    expect(screen.queryByText('80 g, 10 g protein')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('59 calories, 3 grams of protein today')).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
    expect(await entries.listOn('2026-11-24')).toHaveLength(1);
  });

  it('keeps an entry whose question is cancelled, an estimate asked about without the protein it does not state', async () => {
    // Given Today open on an estimate, asked to be deleted
    const entries = new InMemoryEntryStore();
    await entries.add(estimatedEntry({ label: 'pub lunch', calories: 850 }, '2026-11-24'));
    const ask = new ScriptedAsk();
    await openToday(entries, atNoon(), ask);
    await userEvent.press(await screen.findByRole('button', { name: /^Delete Pub lunch/ }));
    expect(ask.question?.message?.replace(/\s/g, ' ')).toMatch(
      /^Pub lunch, about 850 kcal will be removed/,
    );

    // When the user cancels
    await act(async () => ask.answer(false));

    // Then it is there
    expect(screen.getByText('Pub lunch')).toBeOnTheScreen();
    expect(await entries.listOn('2026-11-24')).toHaveLength(1);
  });

  it('leaves an entry whose delete fails, says so over its name, and is an empty day once it works', async () => {
    // Given Today open on one estimate whose delete failed, and now can be written
    const entries = new InMemoryEntryStore();
    await entries.add(estimatedEntry({ label: 'pub lunch', calories: 850 }, '2026-11-24'));
    entries.unwritable = true;
    const ask = new ScriptedAsk();
    await openToday(entries, atNoon(), ask);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: /^Delete Pub lunch/ }));
    await act(async () => ask.answer(true));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete entry');
    const met = await screen.findAllByText(/^(Could not delete entry|Pub lunch)$/);
    expect(met.map((text) => text.children[0])).toEqual(['Could not delete entry', 'Pub lunch']);
    entries.unwritable = false;
    await user.press(screen.getByRole('button', { name: /^Delete Pub lunch/ }));
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();

    // When the user says to delete it again
    await act(async () => ask.answer(true));

    // Then the day is an empty one, its zeros known
    expect(await screen.findByText('Nothing logged yet')).toBeOnTheScreen();
    expect(screen.getByText('0 kcal')).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
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
    expect(screen.queryByText('Couldn’t load today’s summary')).not.toBeOnTheScreen();
  });

  it('goes to Log from an empty day', async () => {
    // Given Today open with nothing logged
    await openToday(new InMemoryEntryStore([OATS]));
    const log = await screen.findByRole('button', { name: 'Log' });

    // When the user takes the way on
    await userEvent.press(log);

    // Then Log is open
    expect(screen).toHavePathname('/log');
  });

  it('says it could not read the day, rather than that it is empty, and reads it when asked', async () => {
    // Given Today open on a day that could not be read, and now can be
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    entries.unreadable = true;
    await openToday(entries);
    const tryAgain = await screen.findByRole('button', { name: 'Retry' });
    expect(screen.getByText('Couldn’t load today’s summary')).toBeOnTheScreen();
    expect(screen.queryByText('Nothing logged yet')).not.toBeOnTheScreen();
    expect(screen.queryByText(/kcal/)).not.toBeOnTheScreen();
    entries.unreadable = false;

    // When the user tries again
    await userEvent.press(tryAgain);

    // Then the day is there, and nothing says it could not be read
    expect(await screen.findByText('Rolled oats')).toBeOnTheScreen();
    expect(screen.queryByText('Couldn’t load today’s summary')).not.toBeOnTheScreen();
  });
});
