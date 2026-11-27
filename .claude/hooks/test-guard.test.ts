import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const GUARD = path.join(__dirname, 'test-guard.sh');

/** The environment without git's own variables, which would point the throwaway repo at the real one. */
const ISOLATED = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
);

/** A test file as committed: two tests, one in a describe. */
const COMMITTED = `import { a } from './a';

describe('a', () => {
  it('is one', () => {
    // Given nothing

    // When a is read
    const value = a;

    // Then it is one
    expect(value).toBe(1);
  });
});

it('is a number', () => {
  // Given nothing

  // When its type is asked
  const kind = typeof 1;

  // Then it is a number
  expect(kind).toBe('number');
});
`;

/** A test written after the committed ones, not yet committed. */
const NEW_TEST = `
it('is less than two', () => {
  // Given nothing

  // When it is compared
  const less = 1 < 2;

  // Then it is less
  expect(less).toBe(true);
});
`;

const git = (root: string, ...args: string[]) =>
  spawnSync('git', args, { cwd: root, env: ISOLATED, encoding: 'utf8' });

/** A repo whose HEAD holds `src/a.test.ts` as COMMITTED, with NEW_TEST added to it uncommitted. */
const repo = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'test-guard-'));
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'a@b.c');
  git(root, 'config', 'user.name', 'a');
  mkdirSync(path.join(root, 'src'));
  writeFileSync(path.join(root, 'src/a.test.ts'), COMMITTED);
  writeFileSync(path.join(root, 'src/a.ts'), 'export const a = 1;\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'tests');
  writeFileSync(path.join(root, 'src/a.test.ts'), COMMITTED + NEW_TEST);
  return root;
};

/** Runs the guard on a tool call, from a session in `root`. */
const guard = (root: string, toolName: string, toolInput: Record<string, unknown>) =>
  spawnSync(GUARD, [], {
    cwd: root,
    input: JSON.stringify({ tool_name: toolName, tool_input: toolInput }),
    env: { ...ISOLATED, CLAUDE_PROJECT_DIR: root },
    encoding: 'utf8',
  });

describe('test-guard.sh', () => {
  it('refuses a Write that rewrites a committed test, naming it', () => {
    // Given a test file whose committed tests are retyped with a renamed variable, and a test added
    const root = repo();
    const rewritten = COMMITTED.replace('const value = a;', 'const judged = a;')
      .replace('expect(value)', 'expect(judged)')
      .concat(NEW_TEST);

    // When it is written whole
    const { status, stderr } = guard(root, 'Write', {
      file_path: path.join(root, 'src/a.test.ts'),
      content: rewritten,
    });

    // Then it is refused, naming the test it would change
    expect(status).toBe(2);
    expect(stderr).toContain('a › is one');
  });

  it('refuses an Edit that changes what a committed test asserts', () => {
    // Given the test file
    const root = repo();

    // When an Edit changes the committed assertion that the type is a number
    const { status, stderr } = guard(root, 'Edit', {
      file_path: path.join(root, 'src/a.test.ts'),
      old_string: "expect(kind).toBe('number');",
      new_string: "expect(kind).toBe('string');",
    });

    // Then it is refused, naming the test
    expect(status).toBe(2);
    expect(stderr).toContain('is a number');
  });

  it('refuses a Write that leaves out a committed test', () => {
    // Given the second committed test left out of the file
    const root = repo();
    const without = COMMITTED.slice(0, COMMITTED.indexOf("it('is a number'"));

    // When it is written whole
    const { status, stderr } = guard(root, 'Write', {
      file_path: path.join(root, 'src/a.test.ts'),
      content: without + NEW_TEST,
    });

    // Then it is refused, naming the test it would remove
    expect(status).toBe(2);
    expect(stderr).toContain('is a number');
  });

  it('lets through a Write that adds a test, leaving the committed ones as they are', () => {
    // Given the file with one more test after the others
    const root = repo();
    const added = `${COMMITTED}${NEW_TEST}\nit('is odd', () => {\n  expect(1 % 2).toBe(1);\n});\n`;

    // When it is written whole
    const { status } = guard(root, 'Write', {
      file_path: path.join(root, 'src/a.test.ts'),
      content: added,
    });

    // Then it goes through
    expect(status).toBe(0);
  });

  it('lets through an Edit to a test not yet committed', () => {
    // Given the test file
    const root = repo();

    // When an Edit changes the test not yet committed
    const { status } = guard(root, 'Edit', {
      file_path: path.join(root, 'src/a.test.ts'),
      old_string: 'const less = 1 < 2;',
      new_string: 'const less = 1 < 3;',
    });

    // Then it goes through
    expect(status).toBe(0);
  });

  it.each([
    ['a source file', 'src/a.ts', 'export const a = 2;\n'],
    ['a test file not yet committed', 'src/b.test.ts', "it('x', () => {});\n"],
  ])('lets through a Write to %s', (_, file, content) => {
    // Given the repo
    const root = repo();

    // When the file is written
    const { status } = guard(root, 'Write', { file_path: path.join(root, file), content });

    // Then it goes through
    expect(status).toBe(0);
  });
});
