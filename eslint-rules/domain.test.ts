import { lint } from './lint';

describe('the framework-free domain', () => {
  it.each([
    ['React', `import { useState } from 'react';`],
    ['React Native', `import { View } from 'react-native';`],
    ['Expo', `import * as SQLite from 'expo-sqlite';`],
    ['a storage adapter', `import { SqliteEntryStore } from '@/storage/SqliteEntryStore';`],
    ['the Clock port', `import type { Clock } from '@/lifecycle/Clock';`],
  ])('refuses %s', (_, code) => {
    // Given domain code reaching outside the domain
    const source = code;

    // When it is linted
    const reported = lint(source, 'src/domain/day.ts');

    // Then the import is refused
    expect(reported).toContain('no-restricted-imports');
  });
});
