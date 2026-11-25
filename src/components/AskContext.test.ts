import { renderHook } from '@testing-library/react-native';

import { useAsk } from './AskContext';

describe('useAsk', () => {
  it('refuses to run without a provider, rather than answering for the user', async () => {
    // Given no AskProvider above the caller, and React's error report kept quiet
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // When a component asks for the way to ask
    const rendering = renderHook(() => useAsk());

    // Then it is refused, naming what is missing
    await expect(rendering).rejects.toThrow('useAsk needs an AskProvider');
  });
});
