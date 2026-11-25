import { optionalFigure } from './figureText';

describe('optionalFigure', () => {
  it.each([
    ['0', 0],
    ['0.0', 0],
    ['-0', 0],
    ['12', 12],
    ['1.5', 1.5],
    ['1,5', 1.5],
    ['1.500', 1.5],
    ['1,2345', 1.2345],
    ['.25', 0.25],
    ['.5', 0.5],
    [',5', 0.5],
    ['5.', 5],
    [' 7 ', 7],
    ['-3', -3],
  ])('reads %s as a figure', (text, figure) => {
    // Given what was typed
    const typed = text;

    // When it is translated
    const translated = optionalFigure.safeParse(typed);

    // Then it is that figure
    expect(translated).toEqual({ success: true, data: figure });
  });

  it.each([
    ['nothing', ''],
    ['spaces', '   '],
  ])('reads %s as not stated, never as 0', (_, text) => {
    // Given a field left blank
    const typed = text;

    // When it is translated
    const translated = optionalFigure.safeParse(typed);

    // Then no figure was stated
    expect(translated).toEqual({ success: true, data: undefined });
  });

  it.each([
    ['1,500', 'Did you mean 1500 or 1.5?'],
    ['2,750', 'Did you mean 2750 or 2.75?'],
    ['0,125', 'Did you mean 125 or 0.125?'],
    ['-1,500', 'Did you mean -1500 or -1.5?'],
  ])('asks which of two figures %s is, rather than taking one', (text, question) => {
    // Given a comma with three digits after it, a thousand to some and a decimal to others
    const typed = text;

    // When it is translated
    const translated = optionalFigure.safeParse(typed);

    // Then it is refused, with both readings written out
    expect(translated.error?.issues.map(({ message }) => message)).toEqual([question]);
  });

  it('refuses a figure too large to be one', () => {
    // Given more digits than any number keeps
    const typed = '9'.repeat(400);

    // When it is translated
    const translated = optionalFigure.safeParse(typed);

    // Then it is refused, asking for a number
    expect(translated.error?.issues.map(({ message }) => message)).toEqual(['Enter a number']);
  });

  it.each(['abc', '1.5.2', '1,5,2', '1,234.5', '1 5', '-', '.', '1e3', '0x10', 'Infinity', '٣'])(
    'refuses %s, which is no figure',
    (text) => {
      // Given something typed that is not a figure
      const typed = text;

      // When it is translated
      const translated = optionalFigure.safeParse(typed);

      // Then it is refused, asking for a number
      expect(translated.error?.issues.map(({ message }) => message)).toEqual(['Enter a number']);
    },
  );
});
