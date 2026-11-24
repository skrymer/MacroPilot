import { screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { TestProviders } from '@/components/TestProviders';

import TabsLayout from './_layout';
import Developer from './developer';
import Foods from './foods';
import Today from './index';

describe('TabsLayout', () => {
  it('holds the Developer page as a tab of its own in a development build', async () => {
    // Given the tab group in a development build, as Jest's is

    // When the app opens on the Developer tab
    await renderRouter(
      {
        '(tabs)/_layout': TabsLayout,
        '(tabs)/index': Today,
        '(tabs)/foods': Foods,
        '(tabs)/developer': Developer,
      },
      { initialUrl: '/developer', wrapper: TestProviders },
    );

    // Then the way in to the design reference is showing
    expect(await screen.findByRole('link', { name: 'Design reference' })).toBeOnTheScreen();
  });
});
