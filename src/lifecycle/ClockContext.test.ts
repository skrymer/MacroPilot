import { renderHook } from '@testing-library/react-native';

import { useClock } from './ClockContext';

describe('useClock', () => {
  it('refuses to run without a provider, rather than handing a screen no clock', async () => {
    // Given no ClockProvider above the caller, and React's error report kept quiet
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // When a component asks for the clock
    const rendering = renderHook(() => useClock());

    // Then it is refused, naming what is missing
    await expect(rendering).rejects.toThrow('useClock needs a ClockProvider');
  });
});
