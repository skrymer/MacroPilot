import { Platform } from 'react-native';

import { barHeader } from './barHeader';
import { scaledBy } from './fontScaleCaps';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { light }: { light: Record<string, string> } = require('../../design-tokens');

describe('barHeader', () => {
  // A platform set by one test is not the next one's.
  afterEach(() => jest.restoreAllMocks());

  it('keeps the title in iOS’s bar at 17 at double text, as UIKit does in a bar of fixed height', () => {
    // Given the text at double, on iOS, as Jest's platform is
    const fontScale = 2;

    // When the bar's look is made
    const look = barHeader(light, fontScale);

    // Then its title is B612 in ink, at 17
    expect(look.headerTitleStyle).toEqual({
      fontFamily: 'B612_700Bold',
      color: light.ink,
      fontSize: 17,
    });
  });

  it('scales the title in Material’s bar with the text', () => {
    // Given the text at one and a quarter, on Android
    jest.replaceProperty(Platform, 'OS', 'android');

    // When the bar's look is made
    const look = barHeader(light, 1.25);

    // Then its title is at the title token's size scaled with it
    expect(look.headerTitleStyle.fontSize).toBe(scaledBy(1.25, 'title'));
  });

  it('stops the title in Material’s bar at 1.5, where the longest form title still fits its one line', () => {
    // Given the text at double, on Android
    jest.replaceProperty(Platform, 'OS', 'android');

    // When the bar's look is made
    const look = barHeader(light, 2);

    // Then its title is at the title token's size scaled to 1.5
    expect(look.headerTitleStyle.fontSize).toBe(scaledBy(1.5, 'title'));
  });

  it('draws the bar’s own buttons in ink', () => {
    // Given the light palette
    const tint = light;

    // When the bar's look is made
    const look = barHeader(tint, 1);

    // Then what the bar draws, such as a form's X, takes ink
    expect(look).toMatchObject({ headerTintColor: light.ink });
  });

  it('lays Material’s bar flat on the ground, as its top app bar is at rest', () => {
    // Given Android
    jest.replaceProperty(Platform, 'OS', 'android');

    // When the bar's look is made
    const look = barHeader(light, 1);

    // Then the bar is the ground's colour, with no shadow
    expect(look).toMatchObject({
      headerStyle: { backgroundColor: light.ground },
      headerShadowVisible: false,
    });
  });
});
