import { lint } from './lint';

const SCREEN = 'app/day.tsx';

describe('design/tokens-only', () => {
  it.each([
    ['a hex colour in a class', `const c = <View className="bg-[#0B0F14]" />;`],
    ['an arbitrary value in a class', `const c = <View className="w-[13px]" />;`],
    ['an arbitrary value kept in a variable', `const cls = 'mt-[7px] flex-1';`],
    ['a hex colour anywhere', `const ground = '#0B0F14';`],
    ['an rgb() colour', `const ground = 'rgb(11, 15, 20)';`],
    ['a colour in an inline style', `const c = <Text style={{ color: 'white' }} />;`],
    ['a named colour on a colour prop', `const c = <ActivityIndicator color="white" />;`],
    [
      'a colour in a style prop of another name',
      `const c = <ScrollView contentContainerStyle={{ backgroundColor: x }} />;`,
    ],
  ])('reports %s', (_, code) => {
    // Given a screen that styles around the tokens
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the token rule reports it
    expect(reported).toContain('design/tokens-only');
  });

  it.each([
    ['a token class', `const c = <View className="bg-ground text-ink" />;`],
    ['a layout value in an inline style', `const c = <View style={{ height: bar.height }} />;`],
    [
      'transparent, which is no colour at all',
      `const c = <View style={{ backgroundColor: 'transparent' }} />;`,
    ],
    ['a hash in copy that is not a colour', `const c = <Text>Recipe #12</Text>;`],
  ])('accepts %s', (_, code) => {
    // Given a screen styled through the tokens
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the token rule is silent
    expect(reported).not.toContain('design/tokens-only');
  });
});

describe('design/no-dark-variant', () => {
  it.each([
    ['a dark: class', `const c = <View className="bg-ground dark:bg-surface" />;`],
    ['a dark: class behind another variant', `const c = <View className="active:dark:bg-line" />;`],
  ])('reports %s', (_, code) => {
    // Given a class that switches colour itself, around the tokens
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the dark-variant rule reports it
    expect(reported).toContain('design/no-dark-variant');
  });

  it('accepts dark as a word', () => {
    // Given copy that says dark
    const source = `const c = <Text accessibilityLabel="a dark room: the day screen" />;`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the dark-variant rule is silent
    expect(reported).not.toContain('design/no-dark-variant');
  });
});

describe('design/no-dash-placeholder', () => {
  it.each([
    ['an em dash as text', `const c = <Text>—</Text>;`],
    ['a hyphen as text', `const c = <Text> - </Text>;`],
    ['a double hyphen in an expression', `const c = <Text>{'--'}</Text>;`],
    ['a dash as a fallback', `const shown = protein ?? '—';`],
    ['a dash in a conditional', `const shown = known ? String(protein) : '-';`],
    ['a dash as a prop', `const c = <Readout value="–" />;`],
  ])('reports %s', (_, code) => {
    // Given a value slot that falls back to a dash
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the placeholder rule reports it
    expect(reported).toContain('design/no-dash-placeholder');
  });

  it.each([
    ['a dash inside copy', `const c = <Text>Design — the reference reference</Text>;`],
    ['a negative figure', `const c = <Text>-247</Text>;`],
    ['a dash used in code', `const parts = id.split('-');`],
    ['a dash used in code inside JSX', `const c = <Text>{id.split('-')[0]}</Text>;`],
    ['a dash joining a template key', 'const c = <Row key={`${a}-${b}`} />;'],
    ['the words for an absence', `const shown = protein ?? 'not logged';`],
  ])('accepts %s', (_, code) => {
    // Given a dash that is not standing in for a value
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the placeholder rule is silent
    expect(reported).not.toContain('design/no-dash-placeholder');
  });
});

describe('no-irregular-whitespace', () => {
  const NBSP = String.fromCharCode(0xa0);

  it.each([
    ['a string', `const s = '80${NBSP}g';`],
    ['a template', `const s = \`\${n}${NBSP}g\`;`],
    ['JSX text', `const c = <Text>80${NBSP}g</Text>;`],
  ])('reports a raw no-break space in %s, which a rewrite of the line can lose unseen', (_, code) => {
    // Given a no-break space typed as the character itself
    const source = code;

    // When it is linted, in the app or in a test
    const reported = [...lint(source, SCREEN), ...lint(source, 'app/day.test.tsx')];

    // Then the rule reports it in both
    expect(reported.filter((id) => id === 'no-irregular-whitespace')).toHaveLength(2);
  });

  it('accepts a no-break space written as its escape', () => {
    // Given a no-break space written so that it can be seen
    const source = "const s = '80\\u00a0g';";

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then nothing is reported
    expect(reported).not.toContain('no-irregular-whitespace');
  });
});
