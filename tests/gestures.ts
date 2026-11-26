// What Jest cannot load, made loadable (ADR 0001: not a boundary, and no test asserts through it).
// Gesture handler's native module is absent, and it ships this for Jest. Reanimated loads through its
// own resolver, set beside this in `jest.config.js`.
import 'react-native-gesture-handler/jestSetup';

// Expo Router's testing library swaps Reanimated for its mock, whose shared values cannot be listened
// to, and gesture handler listens to a swipe's. Its mock is the real thing here, which Jest can load.
jest.mock('react-native-reanimated/mock', () => {
  const real = jest.requireActual('react-native-reanimated');
  return { ...real, __esModule: true, default: { ...real.default } };
});
