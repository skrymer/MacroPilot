import { screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { TestProviders } from '@/components/TestProviders';
import { InMemoryFoodStore } from '@/storage/InMemoryFoodStore';

import Foods from './foods';

/** Opens the app on Foods, over `foods`. */
const openFoods = (foods: InMemoryFoodStore) =>
  renderRouter(
    { '(tabs)/foods': Foods },
    {
      initialUrl: '/foods',
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders foods={foods}>{children}</TestProviders>
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

  it('says what to do where there are no foods, and shows no figure', async () => {
    // Given no foods
    const foods = new InMemoryFoodStore();

    // When the user opens Foods
    await openFoods(foods);

    // Then the page says so and offers the way on
    expect(await screen.findByText('No foods yet')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add food' })).toBeOnTheScreen();
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
    expect(await screen.findByText('Your foods could not be read')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
    expect(screen.queryByText('No foods yet')).not.toBeOnTheScreen();
    expect(screen.queryByText('Oats')).not.toBeOnTheScreen();
  });

  it('says nothing of the last reading while it reads again', async () => {
    // Given Foods open on foods that could not be read, with the next reading slow
    const foods = new InMemoryFoodStore();
    foods.unreadable = true;
    await openFoods(foods);
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });
    foods.holdNextRead();

    // When the user tries again
    await userEvent.press(tryAgain);

    // Then the page no longer says they could not be read, nor that there are none
    expect(screen.queryByText('Your foods could not be read')).not.toBeOnTheScreen();
    expect(screen.queryByText('No foods yet')).not.toBeOnTheScreen();
  });

  it('reads the foods again when asked, once they can be read', async () => {
    // Given Foods open on foods that could not be read, and now can be
    const foods = new InMemoryFoodStore();
    await foods.add({ name: 'oats', macros: { protein: 13, carbohydrate: 56, fat: 6 } });
    foods.unreadable = true;
    await openFoods(foods);
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });
    foods.unreadable = false;

    // When the user tries again
    await userEvent.press(tryAgain);

    // Then the foods are listed, and nothing says they could not be read
    expect(await screen.findByText('Oats')).toBeOnTheScreen();
    expect(screen.queryByText('Your foods could not be read')).not.toBeOnTheScreen();
  });
});
