import { renderHook } from '@testing-library/react-native';

import { useFoodStore } from './FoodStoreContext';

describe('useFoodStore', () => {
  it('refuses to run without a provider, rather than handing a screen no store', async () => {
    // Given no FoodStoreProvider above the caller, and React's error report kept quiet
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // When a component asks for the store
    const rendering = renderHook(() => useFoodStore());

    // Then it is refused, naming what is missing
    await expect(rendering).rejects.toThrow('useFoodStore needs a FoodStoreProvider');
  });
});
