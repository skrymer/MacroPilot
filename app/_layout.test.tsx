import { act, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import TabsLayout from './(tabs)/_layout';
import Developer from './(tabs)/developer';
import Today from './(tabs)/index';
import RootLayout from './_layout';
import Design from './design';

// NativeWind compiles the stylesheet in Metro; Jest has no CSS loader, and the classes reach the
// rendered elements as `className` without it.
jest.mock('../global.css', () => ({}));

/** React Native's development flag, which a test sets to stand for a release build. */
const build = globalThis as unknown as { __DEV__: boolean };

const openAt = (initialUrl: string) =>
  renderRouter(
    {
      _layout: RootLayout,
      '(tabs)/_layout': TabsLayout,
      '(tabs)/index': Today,
      '(tabs)/developer': Developer,
      design: Design,
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
