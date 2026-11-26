import { FONT_SCALE_CAPS, scaledBy, systemScaledBy } from '../src/components/fontScaleCaps';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwind = require('../tailwind.config.js');

describe('font-scale caps', () => {
  it('classifies every size in the type scale', () => {
    // Given the sizes the design system defines
    const sizes = Object.keys(tailwind.theme.extend.fontSize);

    // When the sizes with a declared cap are listed
    const capped = Object.keys(FONT_SCALE_CAPS);

    // Then they are the same set, so a new size cannot default into scaling unnoticed
    expect(capped.sort()).toEqual(sizes.sort());
  });

  it('scales a size set outside Text to double and stops, as Text does', () => {
    // Given the phone's text at three times, past Android's own largest

    // When the title's size is scaled by it
    const scaled = scaledBy(3, 'title');

    // Then it stops at double
    expect(scaled).toBe(44);
  });

  it('scales a size set outside Text by the text size below the cap', () => {
    // Given the phone's text at 1.3 times

    // When the title's size is scaled by it
    const scaled = scaledBy(1.3, 'title');

    // Then it grows by as much, as the type scale's title would
    expect(scaled).toBeCloseTo(28.6);
    expect(`${scaledBy(1, 'title')}px`).toBe(tailwind.theme.extend.fontSize.title[0]);
  });

  it('scales a size of the system’s own to double and stops', () => {
    // Given the phone's text at three times

    // When iOS's 34pt large title is scaled by it
    const scaled = systemScaledBy(3, 34);

    // Then it stops at double, as every text that is not a figure does
    expect(scaled).toBe(68);
  });
});
