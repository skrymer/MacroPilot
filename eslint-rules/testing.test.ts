import { lint } from './lint';

const TEST = 'app/day.test.tsx';

describe('testing/perceivable-only', () => {
  it('reports a prop read off an element in a test', () => {
    // Given a test asserting a prop the user never sees
    const source = `expect(screen.getByText('154 W').props.style).toBeDefined();`;

    // When it is linted
    const reported = lint(source, TEST);

    // Then the rule reports it
    expect(reported).toContain('testing/perceivable-only');
  });

  it.each([['a style', `expect(screen.getByText('154 W')).toHaveStyle({ color: 'red' });`]])(
    'reports a test asserting %s',
    (_, code) => {
      // Given a test whose assertion reaches past what the user perceives
      const source = code;

      // When it is linted
      const reported = lint(source, TEST);

      // Then the rule reports it
      expect(reported).toContain('testing/perceivable-only');
    },
  );

  it('reports a snapshot of the rendered screen', () => {
    // Given a test that freezes whatever rendered as correct
    const source = `expect(screen.toJSON()).toMatchSnapshot();`;

    // When it is linted
    const reported = lint(source, TEST);

    // Then the rule reports it
    expect(reported).toContain('testing/perceivable-only');
  });

  it('reports an inline snapshot of the rendered screen', () => {
    // Given a test that freezes the rendered tree into its own source
    const source = `expect(screen.toJSON()).toMatchInlineSnapshot();`;

    // When it is linted
    const reported = lint(source, TEST);

    // Then the rule reports it
    expect(reported).toContain('testing/perceivable-only');
  });

  it('reports a query by test ID', () => {
    // Given a test finding an element by an ID no user or screen reader sees
    const source = `screen.getByTestId('protein');`;

    // When it is linted
    const reported = lint(source, TEST);

    // Then the rule reports it
    expect(reported).toContain('testing/perceivable-only');
  });

  it('reports an UNSAFE query into the component tree', () => {
    // Given a test finding an element by its component type
    const source = `screen.UNSAFE_getByType(RideScreen);`;

    // When it is linted
    const reported = lint(source, TEST);

    // Then the rule reports it
    expect(reported).toContain('testing/perceivable-only');
  });

  it("reports a test reaching for the screen's root element", () => {
    // Given a test asserting on the outermost element rather than anything a user reads
    const source = `expect(screen.root).toBeOnTheScreen();`;

    // When it is linted
    const reported = lint(source, TEST);

    // Then the rule reports it
    expect(reported).toContain('testing/perceivable-only');
  });

  it('reports fireEvent, which skips what a real press does', () => {
    // Given a test pressing with fireEvent
    const source = `fireEvent.press(screen.getByText('Start'));`;

    // When it is linted
    const reported = lint(source, TEST);

    // Then the rule reports it
    expect(reported).toContain('testing/perceivable-only');
  });

  it('reports the deprecated test renderer', () => {
    // Given a test importing React's test renderer
    const source = `import renderer from 'react-test-renderer';`;

    // When it is linted
    const reported = lint(source, TEST);

    // Then the rule reports it
    expect(reported).toContain('testing/perceivable-only');
  });

  it('leaves source code alone', () => {
    // Given a component reading its own props
    const source = `const Protein = (props) => props.grams;`;

    // When it is linted as source rather than a test
    const reported = lint(source, 'app/day.tsx');

    // Then the rule is silent
    expect(reported).not.toContain('testing/perceivable-only');
  });

  it('accepts a test asserting the font scale cap, which iOS reads for Larger Text', () => {
    // Given a test asserting a text's scaling cap (ADR 0007)
    const source = `expect(label).toHaveProp('maxFontSizeMultiplier', 2);`;

    // When it is linted
    const reported = lint(source, TEST);

    // Then the rule is silent
    expect(reported).not.toContain('testing/perceivable-only');
  });

  it('reports a test asserting a prop VoiceOver does not read', () => {
    // Given a test asserting a class name
    const source = `expect(header).toHaveProp('className', 'text-ink');`;

    // When it is linted
    const reported = lint(source, TEST);

    // Then the rule reports it
    expect(reported).toContain('testing/perceivable-only');
  });
});
