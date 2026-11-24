import { render, screen } from '@testing-library/react-native';
import { Input } from './Input';

describe('Input', () => {
  it('holds a figure typed in a figure token at its size', async () => {
    // Given a field set in the figure token
    await render(<Input accessibilityLabel="Portion in grams" className="text-figure" />);

    // When the field is found on the screen
    const field = screen.getByLabelText('Portion in grams');

    // Then what is typed in it never scales with Larger Text
    expect(field).toHaveProp('maxFontSizeMultiplier', 1);
  });
});
