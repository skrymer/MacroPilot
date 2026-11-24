import { renderHook } from '@testing-library/react-native';

import { useLogged } from './LoggedContext';

describe('useLogged', () => {
  it('refuses to run without a provider, rather than saying nothing was logged', async () => {
    // Given no LoggedProvider above the caller, and React's error report kept quiet
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // When a component asks for what was logged
    const rendering = renderHook(() => useLogged());

    // Then it is refused, naming what is missing
    await expect(rendering).rejects.toThrow('useLogged needs a LoggedProvider');
  });
});
