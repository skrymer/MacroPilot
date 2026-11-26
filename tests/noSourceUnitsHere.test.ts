import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * `tests/` runs in the tooling project, which Stryker leaves out, so a unit of `src/` tested here
 * shows its mutants as survivors. A constant may be read here, as the caps are against the theme;
 * a function is tested beside it.
 */
const functionsImportedFromSource = (file: string) =>
  [
    ...readFileSync(file, 'utf8').matchAll(
      /import\s*\{([^}]*)\}\s*from\s*'(?:\.\.\/src|@)\/[^']*'/g,
    ),
  ]
    .flatMap(([, names]) => names!.split(','))
    .map((name) => name.trim().replace(/^type\s+/, ''))
    .filter((name) => name && !/^[A-Z][A-Z0-9_]*$/.test(name));

describe('tests/', () => {
  it('imports no function from src/, so Stryker sees the tests that kill its mutants', () => {
    // Given the suites under tests/
    const dir = __dirname;
    const files = readdirSync(dir).filter((name) => name.endsWith('.test.ts'));

    // When the names each imports from src/ are read
    const found = files.flatMap((name) =>
      functionsImportedFromSource(path.join(dir, name)).map((fn) => `${name}: ${fn}`),
    );

    // Then none is a function
    expect(found).toEqual([]);
  });
});
