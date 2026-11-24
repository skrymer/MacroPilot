// NativeWind picks its native helpers when it loads, so a native build is named before the config is.
process.env.NATIVEWIND_OS = 'android';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { theme } = require('../tailwind.config.js');

/** The floor each platform asks for: Apple's 44pt, Material's 48dp (DESIGN.md, *Controls*). */
const FLOORS: [platform: string, floor: string][] = [
  ['ios', '44px'],
  ['android', '48px'],
];

/** The figure `platformSelect(ios/…,android/…)` gives a platform. */
const chosen = (value: string, platform: string) =>
  new RegExp(`[(,]${platform}/([^,)]+)`).exec(value)?.[1];

describe('the touch target', () => {
  it.each(FLOORS)('is the floor of %s, %s, both ways', (platform, floor) => {
    // Given the target's height and width
    const { minHeight, minWidth } = theme.extend;

    // When each is resolved for the platform
    const floors = [minHeight.target, minWidth.target].map((value) => chosen(value, platform));

    // Then each is what that platform asks for
    expect(floors).toEqual([floor, floor]);
  });
});
