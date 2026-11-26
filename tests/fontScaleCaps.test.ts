import { FONT_SCALE_CAPS } from '../src/components/fontScaleCaps';

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
});
