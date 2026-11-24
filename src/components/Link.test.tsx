import { render, screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { Link } from './Link';
import { Text } from './Text';

describe('Link', () => {
  it('caps its label at double, like all other text', async () => {
    // Given a link to the design reference
    await render(
      <Link href="/design" className="text-body">
        The design reference
      </Link>,
    );

    // When the label is found on the screen
    const label = screen.getByText('The design reference');

    // Then it scales with Larger Text no further than double
    expect(label).toHaveProp('maxFontSizeMultiplier', 2);
  });

  it('holds its label inside a target of its own, not the text box', async () => {
    // Given a link with a label smaller than a fingertip
    await render(
      <Link href="/design" className="text-eyebrow">
        The design reference
      </Link>,
    );

    // When VoiceOver finds the link by its name
    const link = screen.getByRole('link', { name: 'The design reference' });

    // Then the label sits inside it, so the target floor is the link's and not the text's
    const label = screen.getByText('The design reference');
    expect(link).not.toBe(label);
    expect(link).toContainElement(label);
  });

  it('takes the user where it points', async () => {
    // Given a holding screen linking to the design reference
    await renderRouter(
      {
        index: () => <Link href="/design">The design reference</Link>,
        design: () => <Text>Design reference</Text>,
      },
      { initialUrl: '/' },
    );

    // When the user taps the link
    await userEvent.press(screen.getByText('The design reference'));

    // Then the design reference is open
    expect(screen.getByText('Design reference')).toBeOnTheScreen();
  });
});
