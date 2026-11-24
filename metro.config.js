const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Expo Router builds its route table with `require.context` over `app/`, and the
// regex it uses excludes only `+api`, `+html` and `+middleware` — a co-located
// `*.test.tsx` is swept in as though it were a route. The bundle then follows
// `@testing-library/react-native` into `require('console')`, a Node builtin
// Metro cannot resolve, and the iOS bundle fails while every test still passes.
//
// Blocking the test files from the bundler keeps co-location, which is the
// convention the `component-testing-best-practices` skill sets. Jest resolves
// its own modules and never consults this list.
config.resolver.blockList = [/\/app\/.*\.test\.tsx?$/];

module.exports = withNativeWind(config, { input: './global.css' });
