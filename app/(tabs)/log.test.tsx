import { act, screen, userEvent } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { TestProviders } from '@/components/TestProviders';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { InMemoryEntryStore } from '@/storage/InMemoryEntryStore';
import { InMemoryFoodStore } from '@/storage/InMemoryFoodStore';

import AddFood from '../add-food';
import LogFood from '../log-food';
import TabsLayout from './_layout';
import Developer from './developer';
import Foods from './foods';
import Today from './index';
import Log from './log';

const OATS = { name: 'rolled OATS', macros: { protein: 13, carbohydrate: 20, fat: 18 } };
const COFFEE = { name: 'coffee', macros: { protein: 0, carbohydrate: 0, fat: 0 } };

/** Noon on 24 November 2026, on a phone in UTC. */
const atNoon = () => {
  const clock = new ScriptedClock();
  clock.advance(Date.UTC(2026, 10, 24, 12));
  return clock;
};

/** A store of `kept` foods, and one of entries of them. */
const storesOf = async (...kept: (typeof OATS)[]) => {
  const foods = new InMemoryFoodStore();
  for (const food of kept) await foods.add(food);
  return { foods, entries: new InMemoryEntryStore(await foods.list()) };
};

/** Opens the app on Log, over those stores. */
const openLog = (
  stores: { foods: InMemoryFoodStore; entries: InMemoryEntryStore },
  clock = atNoon(),
) =>
  renderRouter(
    {
      _layout: () => <Stack />,
      '(tabs)/_layout': TabsLayout,
      '(tabs)/index': Today,
      '(tabs)/log': Log,
      '(tabs)/foods': Foods,
      '(tabs)/developer': Developer,
      'log-food': LogFood,
      'add-food': AddFood,
    },
    {
      initialUrl: '/log',
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders clock={clock} {...stores}>
          {children}
        </TestProviders>
      ),
    },
  );

/** Opens a food's sheet from Log, and types `grams` in it. */
const weigh = async (user: ReturnType<typeof userEvent.setup>, food: RegExp, grams: string) => {
  await user.press(await screen.findByRole('button', { name: food }));
  await user.type(await screen.findByLabelText('Grams'), grams);
};

describe('Log', () => {
  it('logs the grams of a food pressed, and says so on Log', async () => {
    // Given Log open on two foods, and 80 g typed for one of them
    const stores = await storesOf(OATS, COFFEE);
    await openLog(stores);
    const user = userEvent.setup();
    await weigh(user, /^Rolled oats/, '80');

    // When the user logs it
    await user.press(screen.getByRole('button', { name: 'Log entry' }));

    // Then the sheet is gone, Log says what was logged, and the entry is on the phone's day
    expect(await screen.findByText('Logged: Rolled oats')).toBeOnTheScreen();
    expect(screen.getByText('80 g, 235 kcal, 10 g protein')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Grams')).not.toBeOnTheScreen();
    expect(await stores.entries.listOn('2026-11-24')).toMatchObject([
      { name: 'rolled OATS', grams: 80 },
    ]);
  });

  it('asks for the grams of the food pressed, with none stated yet', async () => {
    // Given Log open on two foods
    await openLog(await storesOf(OATS, COFFEE));

    // When the user presses one
    await userEvent.press(await screen.findByRole('button', { name: /^Coffee/ }));

    // Then its sheet names it, and its grams are blank rather than a figure
    expect(await screen.findByRole('header', { name: 'Coffee' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Grams')).toHaveDisplayValue('');
  });

  it.each([
    ['blank', '', 'Enter the grams'],
    ['0', '0', 'Grams must be more than 0'],
    ['negative', '-5', 'Grams must be more than 0'],
  ])('refuses grams that are %s, beside the field, and logs nothing', async (_, typed, fault) => {
    // Given a food's sheet with those grams
    const stores = await storesOf(OATS);
    await openLog(stores);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: /^Rolled oats/ }));
    const field = await screen.findByLabelText('Grams');
    if (typed) await user.type(field, typed);

    // When the user logs it
    await user.press(screen.getByRole('button', { name: 'Log entry' }));

    // Then the sheet says what is wrong, in words and to a screen reader, and nothing is logged
    expect(await screen.findByText(fault)).toBeOnTheScreen();
    expect(screen.getByLabelText('Grams')).toHaveProp('accessibilityHint', fault);
    expect(await stores.entries.listOn('2026-11-24')).toHaveLength(0);
  });

  it('logs one entry however quickly the button is pressed again', async () => {
    // Given 80 g typed, over a store that takes a while to write, and the button pressed
    const stores = await storesOf(OATS);
    const written = stores.entries.holdWrites();
    await openLog(stores);
    const user = userEvent.setup();
    await weigh(user, /^Rolled oats/, '80');
    const button = screen.getByRole('button', { name: 'Log entry' });
    await user.press(button);

    // When it is pressed again before the entry is written
    await user.press(button);

    // Then one entry is logged
    await act(async () => written());
    expect(await screen.findByText('Logged: Rolled oats')).toBeOnTheScreen();
    expect(await stores.entries.listOn('2026-11-24')).toHaveLength(1);
  });

  it('leaves the user where they have gone by the time an entry is written', async () => {
    // Given an entry still being written, with the user gone back and on to another food's sheet
    const stores = await storesOf(OATS, COFFEE);
    const written = stores.entries.holdWrites();
    await openLog(stores);
    const user = userEvent.setup();
    await weigh(user, /^Rolled oats/, '80');
    await user.press(screen.getByRole('button', { name: 'Log entry' }));
    await act(() => router.back());
    await weigh(user, /^Coffee/, '250');

    // When it is written
    await act(async () => written());

    // Then the other food's sheet is still open, with what was typed in it
    expect(screen.getByLabelText('Grams')).toHaveDisplayValue('250');
  });

  it('is on the phone’s day when it is saved, not when its sheet was opened', async () => {
    // Given a phone ten hours ahead of UTC, a sheet opened a minute before its midnight, and two gone by
    const clock = new ScriptedClock();
    clock.setUtcOffset(600);
    clock.advance(Date.UTC(2026, 10, 24, 13, 59));
    const stores = await storesOf(OATS);
    await openLog(stores, clock);
    const user = userEvent.setup();
    await weigh(user, /^Rolled oats/, '80');
    await act(async () => clock.advance(2 * 60_000));

    // When the user logs it
    await user.press(screen.getByRole('button', { name: 'Log entry' }));

    // Then it is on the day that has begun there, which in UTC has not
    await screen.findByText('Logged: Rolled oats');
    expect(await stores.entries.listOn('2026-11-25')).toHaveLength(1);
    expect(await stores.entries.listOn('2026-11-24')).toHaveLength(0);
  });

  it('keeps what it said was logged through a sheet left without logging, and replaces it', async () => {
    // Given an entry logged and said so, and a second food's sheet opened and left
    await openLog(await storesOf(OATS, COFFEE));
    const user = userEvent.setup();
    await weigh(user, /^Rolled oats/, '80');
    await user.press(screen.getByRole('button', { name: 'Log entry' }));
    await screen.findByText('Logged: Rolled oats');
    await weigh(user, /^Coffee/, '250');
    await act(() => router.back());
    expect(screen.getByText('Logged: Rolled oats')).toBeOnTheScreen();
    await weigh(user, /^Coffee/, '250');

    // When the second food is logged
    await user.press(screen.getByRole('button', { name: 'Log entry' }));

    // Then it alone is said, a known zero and all, and announced as it is
    expect(await screen.findByText('Logged: Coffee')).toBeOnTheScreen();
    expect(screen.getByText('250 g, 0 kcal, 0 g protein')).toBeOnTheScreen();
    expect(screen.queryByText('Logged: Rolled oats')).not.toBeOnTheScreen();
    expect(
      screen.getByLabelText('Logged: Coffee, 250 grams, 0 calories, 0 grams of protein'),
    ).toHaveProp('accessibilityLiveRegion', 'polite');
  });

  it('clears what it said was logged once Log is left', async () => {
    // Given an entry logged, and said so
    await openLog(await storesOf(OATS));
    const user = userEvent.setup();
    await weigh(user, /^Rolled oats/, '80');
    await user.press(screen.getByRole('button', { name: 'Log entry' }));
    await screen.findByText('Logged: Rolled oats');
    await act(() => router.navigate('/foods'));
    await screen.findByRole('header', { name: 'Foods' });

    // When the user comes back to Log
    await act(() => router.navigate('/log'));

    // Then it says nothing was logged
    expect(await screen.findByRole('header', { name: 'Log' })).toBeOnTheScreen();
    expect(screen.queryByText('Logged: Rolled oats')).not.toBeOnTheScreen();
  });

  it('says foods that could not be read were not, under no heading, and reads them when asked', async () => {
    // Given Log open on foods that could not be read, and now can be
    const stores = await storesOf(OATS);
    stores.foods.unreadable = true;
    await openLog(stores);
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });
    expect(screen.getByText('Your foods could not be read')).toBeOnTheScreen();
    expect(screen.queryByText('No foods yet')).not.toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'All foods' })).not.toBeOnTheScreen();
    stores.foods.unreadable = false;

    // When the user tries again
    await userEvent.press(tryAgain);

    // Then they are there, under their heading
    expect(await screen.findByRole('button', { name: /^Rolled oats/ })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'All foods' })).toBeOnTheScreen();
  });

  it('leads to Add food where there are no foods', async () => {
    // Given Log open with no foods kept
    await openLog(await storesOf());
    const wayOn = await screen.findByRole('button', { name: 'Add food' });
    expect(screen.getByText('No foods yet')).toBeOnTheScreen();

    // When the user takes the way on
    await userEvent.press(wayOn);

    // Then Add food is open
    expect(await screen.findByRole('button', { name: 'Save food' })).toBeOnTheScreen();
  });

  it('keeps the grams when the save fails, says so, and logs when tried again', async () => {
    // Given 80 g that could not be saved, with the store now able to
    const stores = await storesOf(OATS);
    stores.entries.unwritable = true;
    await openLog(stores);
    const user = userEvent.setup();
    await weigh(user, /^Rolled oats/, '80');
    await user.press(screen.getByRole('button', { name: 'Log entry' }));
    await screen.findByText('Not logged. What you typed is still here.');
    expect(screen.getByLabelText('Grams')).toHaveDisplayValue('80');
    stores.entries.unwritable = false;

    // When the user presses the button again
    await user.press(screen.getByRole('button', { name: 'Log entry' }));

    // Then it is logged
    expect(await screen.findByText('Logged: Rolled oats')).toBeOnTheScreen();
  });
});
