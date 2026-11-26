import { act, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { ScriptedAsk } from '@/components/ScriptedAsk';
import { TestProviders } from '@/components/TestProviders';
import { weighedEntry } from '@/domain/entry';
import { InMemoryEntryStore } from '@/storage/InMemoryEntryStore';
import { InMemoryFoodStore } from '@/storage/InMemoryFoodStore';

import TabsLayout from '../_layout';
import FoodsStack from './_layout';
import Foods from './foods';

/** Opens the app on Foods, over `foods`. */
const openFoods = (foods: InMemoryFoodStore, ask?: ScriptedAsk, entries?: InMemoryEntryStore) =>
  renderRouter(
    {
      '(tabs)/_layout': TabsLayout,
      '(tabs)/(today)/index': () => null,
      '(tabs)/(log)/log': () => null,
      '(tabs)/(foods)/_layout': FoodsStack,
      '(tabs)/(foods)/foods': Foods,
      '(tabs)/developer': () => null,
    },
    {
      initialUrl: '/foods',
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders foods={foods} ask={ask} entries={entries}>
          {children}
        </TestProviders>
      ),
    },
  );

describe('Foods', () => {
  it('says a food’s calories and protein per 100 g, worked out from its macros', async () => {
    // Given one food
    const foods = new InMemoryFoodStore();
    await foods.add({
      name: 'rolled OATS',
      macros: { protein: 13.2, carbohydrate: 56.1, fat: 6.5 },
    });

    // When the user opens Foods
    await openFoods(foods);

    // Then its row says them in whole figures, its name in sentence case
    expect(await screen.findByText('Rolled oats')).toBeOnTheScreen();
    expect(screen.getByText('336 kcal')).toBeOnTheScreen();
    expect(screen.getByText('13 g protein per 100 g')).toBeOnTheScreen();
  });

  it('says a known zero, as a figure and to a screen reader as one row', async () => {
    // Given a food with nothing in it
    const foods = new InMemoryFoodStore();
    await foods.add({ name: 'black coffee', macros: { protein: 0, carbohydrate: 0, fat: 0 } });

    // When the user opens Foods
    await openFoods(foods);

    // Then its zeros are shown, and read out with their units as words
    expect(
      await screen.findByLabelText('Black coffee, 0 calories, 0 grams of protein per 100 grams'),
    ).toBeOnTheScreen();
    expect(screen.getByText('0 kcal')).toBeOnTheScreen();
    expect(screen.getByText('0 g protein per 100 g')).toBeOnTheScreen();
  });

  it('is heard in the singular where a figure is one', async () => {
    // Given a food of one calorie, and one of one gram of protein
    const foods = new InMemoryFoodStore();
    await foods.add({ name: 'tea', macros: { protein: 0, carbohydrate: 0.25, fat: 0 } });
    await foods.add({ name: 'plum', macros: { protein: 1, carbohydrate: 0, fat: 0 } });

    // When the user opens Foods
    await openFoods(foods);

    // Then each is said as one
    expect(
      await screen.findByLabelText('Tea, 1 calorie, 0 grams of protein per 100 grams'),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Plum, 4 calories, 1 gram of protein per 100 grams'),
    ).toBeOnTheScreen();
  });

  it('deletes the food it asked about, once told to', async () => {
    // Given Foods open on two, and one asked to be deleted
    const foods = new InMemoryFoodStore();
    const macros = { protein: 13, carbohydrate: 56, fat: 6 };
    for (const name of ['rolled OATS', 'milk']) await foods.add({ name, macros });
    const ask = new ScriptedAsk();
    await openFoods(foods, ask);
    await userEvent.press(await screen.findByRole('button', { name: 'Delete Rolled oats' }));
    expect(ask.question).toEqual({
      title: 'Delete this food?',
      message:
        'Rolled oats will be removed from your catalog. A food you’ve logged entries against can’t be deleted — your entries depend on it.',
      loses: 'Delete',
    });

    // When the user says to
    await act(async () => ask.answer(true));

    // Then it is gone, and nothing more is said
    expect(await screen.findByText('Milk')).toBeOnTheScreen();
    expect(screen.queryByText('Rolled oats')).not.toBeOnTheScreen();
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
    expect((await foods.list()).map(({ name }) => name)).toEqual(['milk']);
  });

  it('keeps a food whose question is cancelled', async () => {
    // Given Foods open on one, asked to be deleted
    const foods = new InMemoryFoodStore();
    await foods.add({ name: 'milk', macros: { protein: 3, carbohydrate: 5, fat: 3 } });
    const ask = new ScriptedAsk();
    await openFoods(foods, ask);
    await userEvent.press(await screen.findByRole('button', { name: 'Delete Milk' }));

    // When the user cancels
    await act(async () => ask.answer(false));

    // Then it is there
    expect(screen.getByText('Milk')).toBeOnTheScreen();
    expect(await foods.list()).toHaveLength(1);
  });

  it('leaves a food whose delete fails, says so in its row, and deletes it when asked again', async () => {
    // Given Foods open on a food whose delete failed, and now can be written
    const foods = new InMemoryFoodStore();
    await foods.add({ name: 'milk', macros: { protein: 3, carbohydrate: 5, fat: 3 } });
    foods.unwritable = true;
    const ask = new ScriptedAsk();
    await openFoods(foods, ask);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Delete Milk' }));
    await act(async () => ask.answer(true));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete food');
    expect(screen.getByText('Milk')).toBeOnTheScreen();
    foods.unwritable = false;
    await user.press(screen.getByRole('button', { name: 'Delete Milk' }));
    expect(screen.queryByText('Could not delete food')).not.toBeOnTheScreen();

    // When the user says to delete it again
    await act(async () => ask.answer(true));

    // Then it is gone, and nothing says it was not
    expect(await screen.findByText('Build your food catalog')).toBeOnTheScreen();
    expect(screen.queryByText('Could not delete food')).not.toBeOnTheScreen();
  });

  it('says a food was not deleted over its name, since what is under the lowest row is out of view', async () => {
    // Given Foods open on a food that cannot be deleted, asked about
    const foods = new InMemoryFoodStore();
    await foods.add({ name: 'milk', macros: { protein: 3, carbohydrate: 5, fat: 3 } });
    foods.unwritable = true;
    const ask = new ScriptedAsk();
    await openFoods(foods, ask);
    await userEvent.press(await screen.findByRole('button', { name: 'Delete Milk' }));

    // When the user says to
    await act(async () => ask.answer(true));

    // Then the words are met before the food's name
    const met = await screen.findAllByText(/^(Could not delete food|Milk)$/);
    expect(met.map((text) => text.children[0])).toEqual(['Could not delete food', 'Milk']);
  });

  it('keeps a logged food, and says which it is and why', async () => {
    // Given Foods open on two, one of them logged and asked to be deleted
    const foods = new InMemoryFoodStore();
    const macros = { protein: 13, carbohydrate: 56, fat: 6 };
    for (const name of ['rolled OATS', 'milk']) await foods.add({ name, macros });
    const kept = await foods.list();
    const entries = new InMemoryEntryStore(kept);
    const oats = kept.find(({ name }) => name === 'rolled OATS');
    await entries.add(weighedEntry(oats as NonNullable<typeof oats>, 80, '2026-11-24'));
    const ask = new ScriptedAsk();
    await openFoods(foods, ask, entries);
    await userEvent.press(await screen.findByRole('button', { name: 'Delete Rolled oats' }));
    expect(ask.question?.message).toBe(
      'Rolled oats will be removed from your catalog. A food you’ve logged entries against can’t be deleted — your entries depend on it.',
    );

    // When the user says to
    await act(async () => ask.answer(true));

    // Then it is there, with why
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not delete food. Rolled oats has logged Entries and can’t be deleted.',
    );
    expect(await foods.list()).toHaveLength(2);
  });

  it('says no more of a delete that failed once Foods is left', async () => {
    // Given a food that could not be deleted, and the user gone to Today
    const foods = new InMemoryFoodStore();
    await foods.add({ name: 'milk', macros: { protein: 3, carbohydrate: 5, fat: 3 } });
    foods.unwritable = true;
    const ask = new ScriptedAsk();
    await openFoods(foods, ask);
    await userEvent.press(await screen.findByRole('button', { name: 'Delete Milk' }));
    await act(async () => ask.answer(true));
    expect(await screen.findByRole('alert')).toBeOnTheScreen();
    await act(() => router.navigate('/'));

    // When the user comes back
    await act(() => router.navigate('/foods'));

    // Then the food is there, and nothing is said of it: what stopped it may be gone
    expect(await screen.findByText('Milk')).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });

  it('asks nothing more while it asks, or while it deletes', async () => {
    // Given Foods open on two, with one asked about, and the other's Delete pressed over the question
    const foods = new InMemoryFoodStore();
    const macros = { protein: 3, carbohydrate: 5, fat: 3 };
    for (const name of ['milk', 'oats']) await foods.add({ name, macros });
    const deleted = foods.holdWrites();
    const ask = new ScriptedAsk();
    await openFoods(foods, ask);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Delete Milk' }));
    await user.press(screen.getByRole('button', { name: 'Delete Oats' }));
    expect(ask.question?.message).toMatch(/^Milk will be removed from your catalog\./);
    await act(async () => ask.answer(true));

    // When it is pressed again while the first is being deleted
    await user.press(screen.getByRole('button', { name: 'Delete Oats' }));

    // Then nothing is asked, nor while the list is read again, and the first alone goes
    expect(ask.question).toBeUndefined();
    const read = foods.holdNextRead();
    await act(async () => deleted());
    await user.press(screen.getByRole('button', { name: 'Delete Milk' }));
    expect(ask.question).toBeUndefined();
    await act(async () => read());
    expect(screen.getByText('Oats')).toBeOnTheScreen();
    expect(screen.queryByText('Milk')).not.toBeOnTheScreen();
  });

  it('says what to do where there are no foods, and shows no figure', async () => {
    // Given no foods
    const foods = new InMemoryFoodStore();

    // When the user opens Foods
    await openFoods(foods);

    // Then the page says so and offers the way on
    expect(await screen.findByText('Build your food catalog')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add your first food' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Add food' })).not.toBeOnTheScreen();
    expect(screen.queryByText(/kcal/)).not.toBeOnTheScreen();
  });

  it('says it could not read the foods, rather than that there are none', async () => {
    // Given a food that cannot be read
    const foods = new InMemoryFoodStore();
    await foods.add({ name: 'oats', macros: { protein: 13, carbohydrate: 56, fat: 6 } });
    foods.unreadable = true;

    // When the user opens Foods
    await openFoods(foods);

    // Then the page says so, offers to try again, and claims nothing
    expect(await screen.findByText('Couldn’t load your foods')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();
    expect(screen.queryByText('Build your food catalog')).not.toBeOnTheScreen();
    expect(screen.queryByText('Oats')).not.toBeOnTheScreen();
  });

  it('says nothing of the last reading while it reads again', async () => {
    // Given Foods open on foods that could not be read, with the next reading slow
    const foods = new InMemoryFoodStore();
    foods.unreadable = true;
    await openFoods(foods);
    const tryAgain = await screen.findByRole('button', { name: 'Retry' });
    foods.holdNextRead();

    // When the user tries again
    await userEvent.press(tryAgain);

    // Then the page no longer says they could not be read, nor that there are none
    expect(screen.queryByText('Couldn’t load your foods')).not.toBeOnTheScreen();
    expect(screen.queryByText('Build your food catalog')).not.toBeOnTheScreen();
  });

  it('reads the foods again when asked, once they can be read', async () => {
    // Given Foods open on foods that could not be read, and now can be
    const foods = new InMemoryFoodStore();
    await foods.add({ name: 'oats', macros: { protein: 13, carbohydrate: 56, fat: 6 } });
    foods.unreadable = true;
    await openFoods(foods);
    const tryAgain = await screen.findByRole('button', { name: 'Retry' });
    foods.unreadable = false;

    // When the user tries again
    await userEvent.press(tryAgain);

    // Then the foods are listed, and nothing says they could not be read
    expect(await screen.findByText('Oats')).toBeOnTheScreen();
    expect(screen.queryByText('Couldn’t load your foods')).not.toBeOnTheScreen();
  });
});
