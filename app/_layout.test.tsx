import { act, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { Text } from '@/components/Text';

import FoodsStack from './(tabs)/(foods)/_layout';
import Foods from './(tabs)/(foods)/foods';
import LogStack from './(tabs)/(log)/_layout';
import Log from './(tabs)/(log)/log';
import TodayStack from './(tabs)/(today)/_layout';
import Today from './(tabs)/(today)/index';
import TabsLayout from './(tabs)/_layout';
import Developer from './(tabs)/developer';
import NotFound from './+not-found';
import RootLayout from './_layout';
import AddFood from './add-food';
import Design from './design';
import LogFood from './log-food';

// NativeWind compiles the stylesheet in Metro; Jest has no CSS loader, and the classes reach the
// rendered elements as `className` without it.
jest.mock('../global.css', () => ({}));

// The storage boundary (ADR 0001). expo-sqlite is native, and only an adapter's own test touches SQL
// (ADR 0008), so the fake of the port stands where the layout makes the real one.
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () => {
    throw new Error('The app opened its database before anything was read from it');
  },
}));
jest.mock('@/storage/SqliteEntryStore', () => ({
  SqliteEntryStore: class
    extends jest.requireActual('@/storage/InMemoryEntryStore').InMemoryEntryStore
  {
    constructor() {
      // The layout's stores outlive a test, so whichever id the food was given is this one.
      super([1, 2, 3].map((id) => ({ id, name: 'muesli' })));
    }
  },
}));
jest.mock('@/storage/SqliteFoodStore', () => ({
  SqliteFoodStore: jest.requireActual('@/storage/InMemoryFoodStore').InMemoryFoodStore,
}));

/** React Native's development flag, which a test sets to stand for a release build. */
const build = globalThis as unknown as { __DEV__: boolean };

const openAt = (initialUrl: string) =>
  renderRouter(
    {
      _layout: RootLayout,
      '(tabs)/_layout': TabsLayout,
      '(tabs)/(today)/_layout': TodayStack,
      '(tabs)/(today)/index': Today,
      '(tabs)/(log)/_layout': LogStack,
      '(tabs)/(log)/log': Log,
      '(tabs)/(foods)/_layout': FoodsStack,
      '(tabs)/(foods)/foods': Foods,
      'log-food': LogFood,
      '(tabs)/developer': Developer,
      'add-food': AddFood,
      design: Design,
      '+not-found': NotFound,
      // A prototype, as the prototype skill puts one under app/prototype/: none is kept in the app.
      'prototype/x': () => <Text accessibilityRole="header">Prototype</Text>,
    },
    { initialUrl },
  );

describe('RootLayout', () => {
  afterEach(() => {
    build.__DEV__ = true;
  });

  it('opens on the Today tab with everything it needs provided', async () => {
    // Given the app's real root layout over the real tab group

    // When the app starts
    await openAt('/');

    // Then Today is showing, rather than a missing provider having crashed it
    expect(await screen.findByRole('header', { name: 'Today' })).toBeOnTheScreen();
  });

  it('gives Foods the phone’s own store', async () => {
    // Given a phone with nothing stored on it

    // When the app opens on Foods
    await openAt('/foods');

    // Then Foods has read it, rather than a missing provider having crashed it
    expect(await screen.findByText('Build your food catalog')).toBeOnTheScreen();
  });

  it('keeps a food added on Add food where Foods reads it', async () => {
    // Given Add food filled, over the store the root layout makes
    await openAt('/foods');
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Add your first food' }));
    await user.type(await screen.findByLabelText('Name'), 'rolled oats');
    await user.type(screen.getByLabelText('Protein per 100 g'), '13');
    await user.type(screen.getByLabelText('Carbohydrate per 100 g'), '56');
    await user.type(screen.getByLabelText('Fat per 100 g'), '0');

    // When it is saved
    await user.press(screen.getByRole('button', { name: 'Save food' }));

    // Then Foods shows it
    expect(await screen.findByText('Rolled oats')).toBeOnTheScreen();
    expect(screen.getByText('276 kcal')).toBeOnTheScreen();
  });

  it('keeps an entry logged on Log where Today reads it', async () => {
    // Given a food kept, and 100 g of it typed on Log
    await openAt('/add-food');
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Name'), 'muesli');
    await user.type(screen.getByLabelText('Protein per 100 g'), '13');
    await user.type(screen.getByLabelText('Carbohydrate per 100 g'), '56');
    await user.type(screen.getByLabelText('Fat per 100 g'), '0');
    await user.press(screen.getByRole('button', { name: 'Save food' }));
    await act(() => router.navigate('/log'));
    await user.press(await screen.findByRole('button', { name: /^Log Muesli/ }));
    await user.type(await screen.findByLabelText('Weight (g)'), '100');
    await user.press(screen.getByRole('button', { name: 'Log entry' }));
    await screen.findByText('Logged: Muesli');

    // When the user goes to Today
    await act(() => router.navigate('/'));

    // Then it is there
    expect(await screen.findByLabelText(/^Muesli, 100 grams, 276 calories/)).toBeOnTheScreen();
  });

  it('opens the design reference in a development build', async () => {
    // Given a development build, as Jest's is

    // When the app opens on the design reference, as a deep link would
    await openAt('/design');

    // Then it is showing
    expect(await screen.findByRole('header', { name: 'Trim' })).toBeOnTheScreen();
  });

  it('sends a release build that opens the design reference to Today', async () => {
    // Given a release build
    build.__DEV__ = false;

    // When the app opens on the design reference, as a deep link would
    await openAt('/design');

    // Then Today is showing, and the design reference is not
    expect(await screen.findByRole('header', { name: 'Today' })).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Trim' })).not.toBeOnTheScreen();
  });

  it('opens a prototype in a development build', async () => {
    // Given a development build, as Jest's is

    // When the app opens on a prototype, as a deep link would
    await openAt('/prototype/x');

    // Then it is showing
    expect(await screen.findByRole('header', { name: 'Prototype' })).toBeOnTheScreen();
  });

  it('sends a release build that opens a prototype to Today', async () => {
    // Given a release build
    build.__DEV__ = false;

    // When the app opens on a prototype, as a deep link would
    await openAt('/prototype/x');

    // Then Today is showing, and the prototype is not
    expect(await screen.findByRole('header', { name: 'Today' })).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Prototype' })).not.toBeOnTheScreen();
  });

  it('shows the router’s own page for a link to no page in a development build', async () => {
    // Given a development build, as Jest's is

    // When the app opens on a link that matches no page
    await openAt('/no-such-page');

    // Then the router says so
    expect(await screen.findByText('Unmatched Route')).toBeOnTheScreen();
  });

  it('sends a release build that opens a link to no page to Today', async () => {
    // Given a release build
    build.__DEV__ = false;

    // When the app opens on a link that matches no page
    await openAt('/no-such-page');

    // Then Today is showing, and not the router's own page for an unmatched route
    expect(await screen.findByRole('header', { name: 'Today' })).toBeOnTheScreen();
    expect(screen.queryByText('Unmatched Route')).not.toBeOnTheScreen();
  });

  it('leaves no second Today to go back to when a release build already open is sent away', async () => {
    // Given a release build open on Today
    build.__DEV__ = false;
    await openAt('/');

    // When a link opens the design reference
    await act(() => router.push('/design'));

    // Then Today is showing, and going back leaves the app
    expect(await screen.findByRole('header', { name: 'Today' })).toBeOnTheScreen();
    expect(router.canGoBack()).toBe(false);
  });
});
