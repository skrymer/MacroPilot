import { act, screen, userEvent } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { TestProviders } from '@/components/TestProviders';
import { InMemoryFoodStore } from '@/storage/InMemoryFoodStore';

import Foods from './(tabs)/foods';
import AddFood from './add-food';

/** Opens the app at `initialUrl`, over `foods`. */
const openApp = (initialUrl: string, foods: InMemoryFoodStore) =>
  renderRouter(
    { _layout: () => <Stack />, '(tabs)/foods': Foods, 'add-food': AddFood },
    {
      initialUrl,
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders foods={foods}>{children}</TestProviders>
      ),
    },
  );

/** Types `typed` into the fields, each by its label. */
const fill = async (user: ReturnType<typeof userEvent.setup>, typed: Record<string, string>) => {
  for (const [label, text] of Object.entries(typed)) {
    await user.type(await screen.findByLabelText(label), text);
  }
};

const OATS = {
  Name: 'rolled oats',
  'Protein per 100 g': '13,2',
  'Carbohydrate per 100 g': '56.1',
  'Fat per 100 g': '6.5',
};

describe('Add food', () => {
  it('puts a food in Foods, from the way in that an empty list offers', async () => {
    // Given Foods open with none in it, and the form filled from there
    await openApp('/foods', new InMemoryFoodStore());
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Add your first food' }));
    await fill(user, OATS);

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save food' }));

    // Then Foods is showing, with the food in it and the form gone
    expect(await screen.findByText('Rolled oats')).toBeOnTheScreen();
    expect(screen.getByText('336 kcal')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Save food' })).not.toBeOnTheScreen();
  });

  it.each(['Protein', 'Carbohydrate', 'Fat'])(
    'keeps the unit of %s with its figure, so that no line breaks between them',
    async (macro) => {
      // Given no foods
      const foods = new InMemoryFoodStore();

      // When the user opens Add food
      await openApp('/add-food', foods);

      // Then the field's label joins 100 and g, and so does that of Fibre
      expect(screen.getByLabelText('Fibre per 100 g, optional')).toHaveProp(
        'accessibilityLabel',
        'Fibre per 100 g, optional',
      );
      expect(await screen.findByLabelText(`${macro} per 100 g`)).toHaveProp(
        'accessibilityLabel',
        `${macro} per 100 g`,
      );
    },
  );

  it('says each field’s fault and saves nothing, then saves once they are put right', async () => {
    // Given a form refused for its faults, and those put right
    const foods = new InMemoryFoodStore();
    await openApp('/add-food', foods);
    const user = userEvent.setup();
    await fill(user, { Name: '  ', 'Protein per 100 g': '1,500', 'Carbohydrate per 100 g': '-1' });
    await user.press(screen.getByRole('button', { name: 'Save food' }));
    expect(await screen.findByText('Enter a name for this food')).toBeOnTheScreen();
    expect(screen.getByText('Did you mean 1500 or 1.5?')).toBeOnTheScreen();
    expect(screen.getByText('Carbohydrate can’t be negative')).toBeOnTheScreen();
    expect(screen.getByText('Enter fat per 100 g')).toBeOnTheScreen();
    expect(await foods.list()).toEqual([]);
    await user.type(screen.getByLabelText('Name'), 'black coffee');
    for (const macro of ['Protein', 'Carbohydrate', 'Fat']) {
      const field = screen.getByLabelText(`${macro} per 100 g`);
      await user.clear(field);
      await user.type(field, '0');
    }

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save food' }));

    // Then it is in Foods, its zeros kept
    expect(await screen.findByText('Black coffee')).toBeOnTheScreen();
    expect(screen.getByText('0 g protein per 100 g')).toBeOnTheScreen();
  });

  it.each([
    ['left blank', '', '', undefined, undefined, '165 kcal'],
    ['0', '0', '0', 0, 0, '165 kcal'],
    ['stated', '10', '13', 10, 10.257, '257 kcal'],
  ])('keeps fibre and alcohol that are %s', async (_, fibre, abv, keptFibre, keptAlcohol, kcal) => {
    // Given a food filled with them
    const foods = new InMemoryFoodStore();
    await openApp('/add-food', foods);
    const user = userEvent.setup();
    await fill(user, {
      Name: 'muesli',
      'Protein per 100 g': '10',
      'Carbohydrate per 100 g': '20',
      'Fat per 100 g': '5',
      'Fibre per 100 g, optional': fibre,
      'Alcohol % volume, optional': abv,
    });

    // When it is saved
    await user.press(screen.getByRole('button', { name: 'Save food' }));

    // Then its calories count what was stated, and what was not is not a zero
    expect(await screen.findByText(kcal)).toBeOnTheScreen();
    const [kept] = await foods.list();
    expect(kept?.macros.fibre).toBe(keptFibre);
    expect(kept?.macros.alcohol).toBe(keptAlcohol);
  });

  it('opens once, however quickly the way in is pressed again', async () => {
    // Given Foods open, and Add food pressed
    await openApp('/foods', new InMemoryFoodStore());
    const user = userEvent.setup();
    const wayIn = await screen.findByRole('button', { name: 'Add your first food' });
    await user.press(wayIn);

    // When it is pressed again before the page has come
    await user.press(wayIn);

    // Then one step back is Foods
    await act(() => router.back());
    expect(screen.queryByRole('button', { name: 'Save food' })).not.toBeOnTheScreen();
    expect(screen.getByText('Build your food catalog')).toBeOnTheScreen();
  });

  it('puts a food among those there already, in order of name', async () => {
    // Given Foods open with two in it, and the form filled from there
    const foods = new InMemoryFoodStore();
    const macros = { protein: 1, carbohydrate: 2, fat: 3 };
    await foods.add({ name: 'apple', macros });
    await foods.add({ name: 'Zucchini', macros });
    await openApp('/foods', foods);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Add food' }));
    await fill(user, OATS);

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save food' }));

    // Then it is between them
    await screen.findByText('Rolled oats');
    const names = screen.getAllByText(/^(Apple|Rolled oats|Zucchini)$/);
    expect(names.map((name) => name.children[0])).toEqual(['Apple', 'Rolled oats', 'Zucchini']);
  });

  it('says above the button that a refused food was not saved, until one is', async () => {
    // Given the form filled, but for an alcohol no drink has
    await openApp('/add-food', new InMemoryFoodStore());
    const user = userEvent.setup();
    await fill(user, { ...OATS, 'Alcohol % volume, optional': '200' });

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save food' }));

    // Then it says so there, as well as beside the field
    expect(await screen.findByText('Not saved. A field above needs changing.')).toBeOnTheScreen();
    expect(screen.getByText('ABV can’t be over 100%')).toBeOnTheScreen();
    expect(
      screen.queryByText('Could not add food. What you typed is still here.'),
    ).not.toBeOnTheScreen();
  });

  it('stops saying that a field needs changing once none does', async () => {
    // Given a food refused for its alcohol alone
    await openApp('/add-food', new InMemoryFoodStore());
    const user = userEvent.setup();
    await fill(user, { ...OATS, 'Alcohol % volume, optional': '200' });
    await user.press(screen.getByRole('button', { name: 'Save food' }));
    await screen.findByText('Not saved. A field above needs changing.');

    // When the alcohol is put right
    await user.clear(screen.getByLabelText('Alcohol % volume, optional'));

    // Then nothing says a field needs changing
    expect(screen.queryByText('Not saved. A field above needs changing.')).not.toBeOnTheScreen();
  });

  it('has the way out first, where each platform puts it', async () => {
    // Given no foods
    const foods = new InMemoryFoodStore();

    // When the user opens Add food
    await openApp('/add-food', foods);

    // Then Cancel is met before the page's title
    const met = await screen.findAllByText(/^(Cancel|Add food)$/);
    expect(met.map((text) => text.children[0])).toEqual(['Cancel', 'Add food']);
  });

  it('goes back to Foods on Cancel, saving nothing', async () => {
    // Given the form filled, over Foods
    const foods = new InMemoryFoodStore();
    await openApp('/foods', foods);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Add your first food' }));
    await fill(user, OATS);

    // When the user cancels
    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    // Then Foods is showing, with nothing in it
    expect(await screen.findByText('Build your food catalog')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Save food' })).not.toBeOnTheScreen();
    expect(await foods.list()).toEqual([]);
  });

  it('saves one food however quickly the button is pressed again', async () => {
    // Given the form filled, over a store that takes a while to write
    const foods = new InMemoryFoodStore();
    const written = foods.holdWrites();
    await openApp('/add-food', foods);
    const user = userEvent.setup();
    await fill(user, OATS);
    const button = screen.getByRole('button', { name: 'Save food' });
    await user.press(button);

    // When the user presses it again before the food is written
    await user.press(button);

    // Then one food is in Foods
    await act(async () => written());
    expect(await screen.findAllByText('Rolled oats')).toHaveLength(1);
  });

  it('leaves the user where they have gone by the time a save is written', async () => {
    // Given a save still being written, with the user gone back and on to a fresh form
    const foods = new InMemoryFoodStore();
    const written = foods.holdWrites();
    await openApp('/foods', foods);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Add your first food' }));
    await fill(user, OATS);
    await user.press(screen.getByRole('button', { name: 'Save food' }));
    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    await user.press(await screen.findByRole('button', { name: 'Add your first food' }));
    await user.type(await screen.findByLabelText('Name'), 'black coffee');

    // When it is written
    await act(async () => written());

    // Then the fresh form is still open, with what was typed in it
    expect(screen.getByLabelText('Name')).toHaveDisplayValue('black coffee');
  });

  it('keeps what Foods last read, when an older reading comes in after it', async () => {
    // Given a reading of Foods that will fail still out, and a newer one that found no foods
    const foods = new InMemoryFoodStore();
    foods.unreadable = true;
    const olderComesIn = foods.holdNextRead();
    await openApp('/foods', foods);
    foods.unreadable = false;
    await act(() => router.push('/add-food'));
    await userEvent.press(await screen.findByRole('button', { name: 'Cancel' }));
    await screen.findByText('Build your food catalog');

    // When the older one comes in
    await act(async () => olderComesIn());

    // Then Foods still says what the newer one found
    expect(screen.getByText('Build your food catalog')).toBeOnTheScreen();
    expect(screen.queryByText('Couldn’t load your foods')).not.toBeOnTheScreen();
  });

  it('keeps what was typed when the save fails, says so, and saves when tried again', async () => {
    // Given a food that could not be saved, with the store now able to
    const foods = new InMemoryFoodStore();
    foods.unwritable = true;
    await openApp('/add-food', foods);
    const user = userEvent.setup();
    await fill(user, OATS);
    await user.press(screen.getByRole('button', { name: 'Save food' }));
    await screen.findByText('Could not add food. What you typed is still here.');
    const kept = screen.getByLabelText('Protein per 100 g');
    expect(kept).toHaveDisplayValue('13,2');
    foods.unwritable = false;

    // When the user presses the button again
    await user.press(screen.getByRole('button', { name: 'Save food' }));

    // Then the food is in Foods
    expect(await screen.findByText('Rolled oats')).toBeOnTheScreen();
  });
});
