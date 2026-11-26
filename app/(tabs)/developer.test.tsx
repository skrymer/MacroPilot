import { screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { TestProviders } from '@/components/TestProviders';

import TodayStack from './(today)/_layout';
import Today from './(today)/index';
import Developer from './developer';

/** React Native's development flag, which a test sets to stand for a release build. */
const build = globalThis as unknown as { __DEV__: boolean };

describe('Developer', () => {
  afterEach(() => {
    build.__DEV__ = true;
  });

  it('offers the way in to the design reference', async () => {
    // Given a development build, as Jest's is

    // When the app opens on the Developer tab
    await renderRouter({ '(tabs)/developer': Developer }, { initialUrl: '/developer' });

    // Then the design reference is one tap away
    expect(await screen.findByRole('link', { name: 'Design reference' })).toBeOnTheScreen();
  });

  it('sends a release build to Today, even when reached without the tab bar', async () => {
    // Given a release build
    build.__DEV__ = false;

    // When the app opens on the Developer page, as a deep link would
    await renderRouter(
      {
        '(tabs)/(today)/_layout': TodayStack,
        '(tabs)/(today)/index': Today,
        '(tabs)/developer': Developer,
      },
      { initialUrl: '/developer', wrapper: TestProviders },
    );

    // Then Today is showing, and the way in to the design reference is not
    expect(await screen.findByRole('header', { name: 'Today' })).toBeOnTheScreen();
    expect(screen.queryByRole('link', { name: 'Design reference' })).not.toBeOnTheScreen();
  });
});
