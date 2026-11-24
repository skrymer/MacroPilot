import { screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import Index from './index';
import RootLayout from './_layout';

// NativeWind compiles the stylesheet in Metro; Jest has no CSS loader, and the classes reach the
// rendered elements as `className` without it.
jest.mock('../global.css', () => ({}));

describe('RootLayout', () => {
  it('opens the first screen with everything it needs provided', async () => {
    // Given the app's real root layout over the real first screen

    // When the app starts
    await renderRouter({ _layout: RootLayout, index: Index }, { initialUrl: '/' });

    // Then the first screen is showing, rather than a missing provider having crashed it
    expect(await screen.findByRole('header', { name: 'MacroPilot' })).toBeOnTheScreen();
  });
});
