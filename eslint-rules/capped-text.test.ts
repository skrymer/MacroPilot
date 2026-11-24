import { lint } from './lint';

describe('a11y/capped-text', () => {
  it.each([['app/day.tsx'], ['src/components/Card.tsx'], ['src/storage/entryStore.ts']])(
    "reports React Native's Text in %s",
    (filePath) => {
      // Given code reaching past the app's own text component
      const source = `import { Text } from 'react-native';`;

      // When it is linted
      const reported = lint(source, filePath);

      // Then the capped-text rule reports it
      expect(reported).toContain('a11y/capped-text');
    },
  );

  it("reports expo-router's Link, which draws React Native's Text", () => {
    // Given a screen linking with the router's own component
    const source = `import { Link } from 'expo-router';`;

    // When it is linted
    const reported = lint(source, 'app/index.tsx');

    // Then the capped-text rule reports it
    expect(reported).toContain('a11y/capped-text');
  });

  it("reports React Native's TextInput, which types uncapped and unstyled", () => {
    // Given a screen drawing a field with React Native's own component
    const source = `import { TextInput } from 'react-native';`;

    // When it is linted
    const reported = lint(source, 'app/(tabs)/settings.tsx');

    // Then the capped-text rule reports it
    expect(reported).toContain('a11y/capped-text');
  });

  it('reports a namespace import that reaches the uncapped Text', () => {
    // Given a screen importing React Native whole
    const source = `import * as RN from 'react-native';`;

    // When it is linted
    const reported = lint(source, 'app/day.tsx');

    // Then the capped-text rule reports it, because RN.Text skips the cap
    expect(reported).toContain('a11y/capped-text');
  });

  it('reports a re-export of the uncapped Text', () => {
    // Given a barrel file passing React Native's Text along
    const source = `export { Text } from 'react-native';`;

    // When it is linted
    const reported = lint(source, 'src/components/index.ts');

    // Then the capped-text rule reports it
    expect(reported).toContain('a11y/capped-text');
  });

  it('reports a wholesale re-export that carries the uncapped Text', () => {
    // Given a barrel file passing all of React Native along
    const source = `export * from 'react-native';`;

    // When it is linted
    const reported = lint(source, 'src/components/index.ts');

    // Then the capped-text rule reports it
    expect(reported).toContain('a11y/capped-text');
  });

  it("lets the app's own Text wrap React Native's", () => {
    // Given the component that applies the font-scaling cap
    const source = `import { Text } from 'react-native';`;

    // When it is linted
    const reported = lint(source, 'src/components/Text.tsx');

    // Then the capped-text rule is silent
    expect(reported).not.toContain('a11y/capped-text');
  });

  it("lets the app's own Link wrap the router's", () => {
    // Given the component that gives a link a capped label
    const source = `import { Link } from 'expo-router';`;

    // When it is linted
    const reported = lint(source, 'src/components/Link.tsx');

    // Then the capped-text rule is silent
    expect(reported).not.toContain('a11y/capped-text');
  });
});
