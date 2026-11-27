import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPT = path.join(__dirname, 'scope.sh');

/**
 * The environment without git's own variables. A git hook (the pre-push one runs this suite) sets
 * `GIT_DIR` and friends, and git obeys them over the working directory: these throwaway repos would
 * commit into the real one, switch its branch and rewrite its identity.
 */
const ISOLATED = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
);

/** Runs `command` in `dir`, isolated from any repo the suite itself runs inside. */
const run = (dir: string, command: string, ...args: string[]) =>
  execFileSync(command, args, { cwd: dir, env: ISOLATED, encoding: 'utf8' });

/** A git repo in a fresh directory, `files` committed on `main`. */
const repo = (files: Record<string, string>) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'scope-'));
  const git = (...args: string[]) => run(dir, 'git', ...args);
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  write(dir, files);
  git('add', '-A');
  git('commit', '-qm', 'base');
  return dir;
};

const write = (dir: string, files: Record<string, string>) =>
  Object.entries(files).forEach(([file, content]) => {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  });

const lines = (n: number, prefix = 'line') =>
  Array.from({ length: n }, (_, i) => `${prefix} ${i + 1}`).join('\n') + '\n';

const scope = (dir: string) => run(dir, SCRIPT, 'main').trim().split(',');

describe('scope.sh', () => {
  it('names only the lines the change added or altered, as Stryker line ranges', () => {
    // Given a source file whose lines 3 and 7-8 changed since main
    const dir = repo({ 'src/a.ts': lines(10) });
    write(dir, {
      'src/a.ts': lines(10)
        .replace('line 3\n', 'changed 3\n')
        .replace('line 7\nline 8\n', 'changed 7\nchanged 8\n'),
    });

    // When the scope is taken
    const ranges = scope(dir);

    // Then it is those lines and no others
    expect(ranges).toEqual(['src/a.ts:3-3', 'src/a.ts:7-8']);
  });

  it('leaves out a line whose only change is its indentation', () => {
    // Given lines 2-4 re-indented since main, as a removed wrapper leaves them, and line 3 also changed
    const dir = repo({ 'src/a.ts': 'open\n    two\n    three\n    four\nclose\n' });
    write(dir, { 'src/a.ts': 'open\n  two\n  changed\n  four\nclose\n' });

    // When the scope is taken
    const ranges = scope(dir);

    // Then it is the changed line alone
    expect(ranges).toEqual(['src/a.ts:3-3']);
  });

  it('names a file the change created whole, committed or not', () => {
    // Given one new file committed on the branch and one not yet added
    const dir = repo({ 'src/a.ts': lines(2) });
    run(dir, 'git', 'switch', '-qc', 'feature');
    write(dir, { 'src/committed.ts': lines(3) });
    run(dir, 'git', 'add', '-A');
    run(dir, 'git', 'commit', '-qm', 'new');
    write(dir, { 'app/untracked.tsx': lines(2) });

    // When the scope is taken
    const ranges = scope(dir);

    // Then both are in it
    expect(ranges).toEqual(['app/untracked.tsx', 'src/committed.ts:1-3']);
  });

  it('names a dynamic route whole, its brackets as wildcards, since Stryker takes no range on a glob', () => {
    // Given an Expo Router dynamic route whose line 2 changed since main
    const dir = repo({ 'app/foods/[id].tsx': lines(3) });
    write(dir, { 'app/foods/[id].tsx': lines(3).replace('line 2\n', 'changed 2\n') });

    // When the scope is taken
    const ranges = scope(dir);

    // Then the file is named whole, as a glob Stryker matches to it
    expect(ranges).toEqual(['app/foods/?id?.tsx']);
  });

  it('names a dynamic route not yet added the same way', () => {
    // Given an Expo Router dynamic route the change created and has not added
    const dir = repo({ 'src/a.ts': lines(2) });
    write(dir, { 'app/foods/[id].tsx': lines(2) });

    // When the scope is taken
    const ranges = scope(dir);

    // Then it is named as a glob Stryker matches to it
    expect(ranges).toEqual(['app/foods/?id?.tsx']);
  });

  it('leaves out tests, deletions and anything outside src/ and app/', () => {
    // Given changes only to a test, a removed line, and a tool script
    const dir = repo({ 'src/a.ts': lines(3), 'src/a.test.ts': lines(2), 'tools/x.ts': lines(1) });
    write(dir, {
      'src/a.ts': lines(3).replace('line 2\n', ''),
      'src/a.test.ts': lines(3),
      'tools/x.ts': lines(2),
    });

    // When the scope is taken
    const output = run(dir, SCRIPT, 'main');

    // Then nothing is in it
    expect(output).toBe('');
  });
});
