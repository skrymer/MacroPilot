import { screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import TabsLayout from './(tabs)/_layout';
import Today from './(tabs)/index';
import RootLayout from './_layout';

// NativeWind compiles the stylesheet in Metro; Jest has no CSS loader, and the classes reach the
// rendered elements as `className` without it.
jest.mock('../global.css', () => ({}));

describe('RootLayout', () => {
  it('opens on the Today tab with everything it needs provided', async () => {
    // Given the app's real root layout over the real tab group

    // When the app starts
    await renderRouter(
      { _layout: RootLayout, '(tabs)/_layout': TabsLayout, '(tabs)/index': Today },
      { initialUrl: '/' },
    );

    // Then Today is showing, rather than a missing provider having crashed it
    expect(await screen.findByRole('header', { name: 'Today' })).toBeOnTheScreen();
  });
});
