import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const REFACTOR = path.join(__dirname, 'refactor.mjs');
const CONFIG = path.join(__dirname, '../../probity.config.ts');

/** The environment without git's own variables, which would point the throwaway repo at the real one. */
const ISOLATED = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
);

/** What the throwaway checkout's `src/a.ts` starts as, and what a refactor turns it into. */
const ORIGINAL = 'export const a = 1;\n';
const REFACTORED = 'export const a = 0 + 1;\n';

const git = (cwd: string, ...args: string[]) =>
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    cwd,
    env: ISOLATED,
    encoding: 'utf8',
  });

/** Installs `body` as the bash script `node_modules/.bin/<name>` in `root`. */
const standIn = (root: string, name: string, body: string) => {
  const bin = path.join(root, 'node_modules/.bin', name);
  writeFileSync(bin, `#!/usr/bin/env bash\n${body}\n`);
  chmodSync(bin, 0o755);
};

/**
 * A checkout with this repo's probity config, `src/a.ts`, `src/b.ts` and their test committed, and
 * stand-ins for Jest, tsc and ESLint that report what they were run with and pass.
 */
const checkout = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'refactor-'));
  git(root, 'init', '-q');
  mkdirSync(path.join(root, 'src'));
  writeFileSync(path.join(root, 'src/a.ts'), ORIGINAL);
  writeFileSync(path.join(root, 'src/b.ts'), ORIGINAL);
  writeFileSync(path.join(root, 'src/a.test.ts'), ORIGINAL);
  copyFileSync(CONFIG, path.join(root, 'probity.config.ts'));
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'start');
  mkdirSync(path.join(root, 'node_modules/.bin'), { recursive: true });
  for (const tool of ['jest', 'tsc', 'eslint']) {
    standIn(root, tool, `echo "${tool} ran in $PWD with $*" >&2\nexit 0`);
  }
  return root;
};

/** Runs `refactor.mjs` with `args` from `cwd`, the time on the clock `now` when given. */
const refactor = (cwd: string, args: string[], now?: number) =>
  spawnSync('node', [REFACTOR, ...args], {
    cwd,
    env: { ...ISOLATED, ...(now === undefined ? {} : { REFACTOR_NOW: String(now) }) },
    encoding: 'utf8',
  });

const read = (root: string, file: string) => readFileSync(path.join(root, file), 'utf8');

describe('refactor.mjs open', () => {
  it.each([
    ['changed', 'src/a.test.ts'],
    ['new', 'src/new/c.test.tsx'],
  ])('refuses while a test file is %s since HEAD', (_, file) => {
    // Given a checkout with a test file differing from HEAD
    const root = checkout();
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), 'export const changed = 1;\n');

    // When a window is opened
    const { status, stderr } = refactor(root, ['open', 'src/a.test.ts']);

    // Then it is refused, naming the test, and no window is open
    expect(status).not.toBe(0);
    expect(stderr).toContain(file);
    expect(refactor(root, ['status']).stdout).toContain('No refactor window');
  });

  it('refuses when no test is named', () => {
    // Given a clean checkout
    const root = checkout();

    // When a window is opened without naming the tests that cover the code
    const { status, stderr } = refactor(root, ['open']);

    // Then it is refused, saying why
    expect(status).not.toBe(0);
    expect(stderr).toContain('Name the tests');
  });

  it('refuses when the named tests fail', () => {
    // Given a checkout whose tests fail
    const root = checkout();
    standIn(root, 'jest', 'echo "jest: 1 failed" >&2\nexit 1');

    // When a window is opened
    const { status, stderr } = refactor(root, ['open', 'src/a.test.ts']);

    // Then it is refused, and no window is open
    expect(status).not.toBe(0);
    expect(stderr).toContain('jest: 1 failed');
    expect(refactor(root, ['status']).stdout).toContain('No refactor window');
  });

  it('opens with the named tests green, run from the checkout’s root', () => {
    // Given a clean checkout whose tests pass
    const root = checkout();

    // When a window is opened from a directory inside it
    const { status, stdout, stderr } = refactor(path.join(root, 'src'), ['open', 'src/a.test.ts']);

    // Then the tests ran from the root, and the window is open with how to close it
    expect(status).toBe(0);
    expect(stderr).toContain(`jest ran in ${root} with src/a.test.ts`);
    expect(stdout).toContain('refactor.mjs close');
    expect(refactor(root, ['status']).stdout).toContain('open');
  });

  it('refuses a second window while one is open', () => {
    // Given an open window
    const root = checkout();
    refactor(root, ['open', 'src/a.test.ts']);

    // When another is opened
    const { status, stderr } = refactor(root, ['open', 'src/a.test.ts']);

    // Then it is refused
    expect(status).not.toBe(0);
    expect(stderr).toContain('already open');
  });
});

describe('refactor.mjs status', () => {
  it('says the window has expired after 30 minutes', () => {
    // Given a window opened at a known time
    const root = checkout();
    refactor(root, ['open', 'src/a.test.ts'], 1_000_000);

    // When its status is asked 30 minutes later
    const { stdout } = refactor(root, ['status'], 1_000_000 + 30 * 60);

    // Then it says it has expired
    expect(stdout).toContain('expired');
  });
});

describe('refactor.mjs close', () => {
  it('refuses when no window is open', () => {
    // Given a checkout with no window
    const root = checkout();

    // When the window is closed
    const { status, stderr } = refactor(root, ['close']);

    // Then it is refused, saying so
    expect(status).not.toBe(0);
    expect(stderr).toContain('No refactor window');
  });

  it('keeps a refactor that passes, closes the window and names the files it changed', () => {
    // Given an open window in which src/a.ts was refactored and src/c.ts created
    const root = checkout();
    refactor(root, ['open', 'src/a.test.ts']);
    writeFileSync(path.join(root, 'src/a.ts'), REFACTORED);
    writeFileSync(path.join(root, 'src/c.ts'), ORIGINAL);

    // When the window is closed
    const { status, stdout, stderr } = refactor(root, ['close']);

    // Then the tests, the types and the changed files' lint ran, the change stands and is named
    expect(status).toBe(0);
    expect(stderr).toContain(`jest ran in ${root} with src/a.test.ts`);
    expect(stderr).toContain('tsc ran in');
    expect(stderr).toContain('with --noEmit -p .');
    expect(stderr).toMatch(/eslint ran in .* with src\/a\.ts src\/c\.ts\n/);
    expect(read(root, 'src/a.ts')).toBe(REFACTORED);
    expect(stdout).toContain('src/a.ts');
    expect(stdout).toContain('src/c.ts');
    expect(refactor(root, ['status']).stdout).toContain('No refactor window');
  });

  it.each([
    ['the tests fail', 'jest'],
    ['the types do not check', 'tsc'],
    ['the lint fails', 'eslint'],
  ])('rolls the source back to the window’s start when %s', (_, tool) => {
    // Given an open window in which a file was changed, one created and one deleted
    const root = checkout();
    refactor(root, ['open', 'src/a.test.ts']);
    writeFileSync(path.join(root, 'src/a.ts'), REFACTORED);
    writeFileSync(path.join(root, 'src/c.ts'), ORIGINAL);
    rmSync(path.join(root, 'src/b.ts'));
    standIn(root, tool, `echo "${tool}: failed" >&2\nexit 1`);

    // When the window is closed
    const { status, stdout, stderr } = refactor(root, ['close']);

    // Then each file is as the window found it, what failed is named, and the window is closed
    expect(status).not.toBe(0);
    expect(read(root, 'src/a.ts')).toBe(ORIGINAL);
    expect(existsSync(path.join(root, 'src/c.ts'))).toBe(false);
    expect(read(root, 'src/b.ts')).toBe(ORIGINAL);
    expect(`${stdout}${stderr}`).toContain(`${tool}: failed`);
    expect(`${stdout}${stderr}`).toContain('rolled back');
    expect(refactor(root, ['status']).stdout).toContain('No refactor window');
  });

  it('rolls back to the window’s start, not to HEAD', () => {
    // Given src/a.ts changed before the window opened, then changed again in it
    const root = checkout();
    writeFileSync(path.join(root, 'src/a.ts'), REFACTORED);
    refactor(root, ['open', 'src/a.test.ts']);
    writeFileSync(path.join(root, 'src/a.ts'), 'export const a = 2 - 1;\n');
    standIn(root, 'jest', 'exit 1');

    // When the window closes red
    refactor(root, ['close']);

    // Then src/a.ts is as the window found it
    expect(read(root, 'src/a.ts')).toBe(REFACTORED);
  });
});
