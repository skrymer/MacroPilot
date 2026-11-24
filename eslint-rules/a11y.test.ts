import { lint } from './lint';

const SCREEN = 'app/day.tsx';

describe('a11y/touch-target', () => {
  it.each([
    ['no size at all', `const c = <Pressable accessibilityRole="button" />;`],
    ['only a height floor', `const c = <Pressable className="min-h-target" />;`],
    ['a size from the numeric scale', `const c = <Pressable className="h-11 w-11" />;`],
    ['no size, animated', `const c = <Animated.Pressable accessibilityRole="button" />;`],
    ['no size, as a Touchable', `const c = <TouchableOpacity accessibilityRole="button" />;`],
  ])('reports a Pressable with %s', (_, code) => {
    // Given a Pressable that may be smaller than 44pt
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the touch-target rule reports it
    expect(reported).toContain('a11y/touch-target');
  });

  it.each([
    ['the target floor', `const c = <Pressable className="min-h-target min-w-target px-4" />;`],
    ['a hitSlop', `const c = <Pressable hitSlop={12} />;`],
  ])('accepts a Pressable with %s', (_, code) => {
    // Given a Pressable guaranteed a 44pt target
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the touch-target rule is silent
    expect(reported).not.toContain('a11y/touch-target');
  });
});

describe('a11y/pressable-role', () => {
  it.each([
    ['a Pressable', `const c = <Pressable hitSlop={12} />;`],
    ['an Animated.Pressable', `const c = <Animated.Pressable hitSlop={12} />;`],
    ['a TouchableOpacity', `const c = <TouchableOpacity hitSlop={12} />;`],
  ])('reports %s without a role', (_, code) => {
    // Given a control VoiceOver cannot name the kind of
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the role rule reports it
    expect(reported).toContain('a11y/pressable-role');
  });

  it.each([
    ['accessibilityRole', `const c = <Pressable accessibilityRole="button" hitSlop={12} />;`],
    ['role', `const c = <Pressable role="button" hitSlop={12} />;`],
  ])('accepts a Pressable that declares its role with %s', (_, code) => {
    // Given a Pressable that says it is a button
    const source = code;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the role rule is silent
    expect(reported).not.toContain('a11y/pressable-role');
  });
});

describe('a11y/no-font-scaling-off', () => {
  it('reports text that refuses to scale', () => {
    // Given text with font scaling switched off
    const source = `const c = <Text allowFontScaling={false}>247</Text>;`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the font-scaling rule reports it
    expect(reported).toContain('a11y/no-font-scaling-off');
  });

  it('accepts text that scales', () => {
    // Given text that leaves font scaling alone
    const source = `const c = <Text maxFontSizeMultiplier={1.5}>247</Text>;`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the font-scaling rule is silent
    expect(reported).not.toContain('a11y/no-font-scaling-off');
  });
});

describe('restricted APIs', () => {
  it('reports Alert in a screen', () => {
    // Given a screen that reaches for a modal
    const source = `import { Alert } from 'react-native';`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the import is refused
    expect(reported).toContain('no-restricted-imports');
  });

  it('accepts the rest of react-native in a screen', () => {
    // Given a screen importing ordinary components
    const source = `import { View } from 'react-native';`;

    // When it is linted
    const reported = lint(source, SCREEN);

    // Then the import is allowed
    expect(reported).not.toContain('no-restricted-imports');
  });

  it.each([['app/day.tsx'], ['src/domain/day.ts'], ['src/storage/entryStore.ts']])(
    'reports Date.now() in %s',
    (filePath) => {
      // Given code that reads the wall clock directly
      const source = `const at = Date.now();`;

      // When it is linted
      const reported = lint(source, filePath);

      // Then the call is refused
      expect(reported).toContain('no-restricted-properties');
    },
  );

  it.each([
    ['new Date()', `const at = new Date();`, 'no-restricted-syntax'],
    ['performance.now()', `const at = performance.now();`, 'no-restricted-properties'],
    ['Date() called bare', `const at = Date();`, 'no-restricted-syntax'],
  ])('reports %s, the other ways to read the clock', (_, code, rule) => {
    // Given code that reads the clock without Date.now
    const source = code;

    // When it is linted
    const reported = lint(source, 'src/domain/day.ts');

    // Then the read is refused
    expect(reported).toContain(rule);
  });

  it('accepts a Date built from a known instant', () => {
    // Given a Date constructed from a timestamp the code was given
    const source = `const at = new Date(timestamp);`;

    // When it is linted
    const reported = lint(source, 'src/domain/day.ts');

    // Then it is allowed, because it reads no clock
    expect(reported).not.toContain('no-restricted-syntax');
  });

  it('keeps the domain import boundary alongside the Alert ban', () => {
    // Given domain code importing React Native
    const source = `import { Alert } from 'react-native';`;

    // When it is linted
    const reported = lint(source, 'src/domain/day.ts');

    // Then the framework-free rule still refuses it
    expect(reported).toContain('no-restricted-imports');
  });
});
