import { render, screen } from '@testing-library/react-native';

import { Text } from './Text';

describe('Text', () => {
  it.each([['text-figure-lg'], ['text-figure'], ['text-unit']])(
    'holds a figure in %s at its size',
    async (token) => {
      // Given a figure in a measured-figure token, or the unit set beside it
      await render(<Text className={token}>182</Text>);

      // When the figure is found on the screen
      const figure = screen.getByText('182');

      // Then it never scales with Larger Text
      expect(figure).toHaveProp('maxFontSizeMultiplier', 1);
    },
  );

  it('finds the figure token among other classes', async () => {
    // Given a figure styled with its font and colour as well as its size
    await render(<Text className="text-figure-lg text-ink">247</Text>);

    // When the figure is found on the screen
    const figure = screen.getByText('247');

    // Then it still never scales with Larger Text
    expect(figure).toHaveProp('maxFontSizeMultiplier', 1);
  });

  it('holds a figure whose size is set behind a variant', async () => {
    // Given a figure sized only on iOS
    await render(<Text className="ios:text-figure-lg">247</Text>);

    // When the figure is found on the screen
    const figure = screen.getByText('247');

    // Then it still never scales with Larger Text
    expect(figure).toHaveProp('maxFontSizeMultiplier', 1);
  });

  it('holds a span inside a figure at the figure size', async () => {
    // Given a figure with its unit set in a nested span that names no size
    await render(
      <Text className="text-figure-lg">
        247<Text>g</Text>
      </Text>,
    );

    // When the unit is found on the screen
    const unit = screen.getByText('g');

    // Then it inherits the figure's cap rather than scaling to double
    expect(unit).toHaveProp('maxFontSizeMultiplier', 1);
  });

  it('takes the stricter cap when two sizes are named', async () => {
    // Given a figure whose class list names a text size before its figure size
    await render(<Text className="text-body text-figure-lg">247</Text>);

    // When the figure is found on the screen
    const figure = screen.getByText('247');

    // Then it never scales, whichever size the stylesheet resolves to
    expect(figure).toHaveProp('maxFontSizeMultiplier', 1);
  });

  it('lets body text grow to double', async () => {
    // Given a label in a text token
    await render(<Text className="text-body">Protein</Text>);

    // When the label is found on the screen
    const label = screen.getByText('Protein');

    // Then it scales with Larger Text up to twice its size
    expect(label).toHaveProp('maxFontSizeMultiplier', 2);
  });

  it('keeps the cap a caller tries to override', async () => {
    // Given a figure whose caller asks for a different multiplier
    await render(
      // @ts-expect-error the cap is the size token's to set, not the caller's
      <Text className="text-figure-lg" maxFontSizeMultiplier={3}>
        247
      </Text>,
    );

    // When the figure is found on the screen
    const figure = screen.getByText('247');

    // Then the token's cap wins
    expect(figure).toHaveProp('maxFontSizeMultiplier', 1);
  });

  it('lets text with no size token grow to double', async () => {
    // Given text that names no size at all
    await render(<Text>Nothing logged</Text>);

    // When the text is found on the screen
    const text = screen.getByText('Nothing logged');

    // Then it scales with Larger Text up to twice its size
    expect(text).toHaveProp('maxFontSizeMultiplier', 2);
  });
});
