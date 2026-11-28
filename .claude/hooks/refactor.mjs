// The refactor window: a refactor checked by the tests that cover it, not judged write by write.
//
// Probity judges a write from the last 20 events and the target file alone, so it refuses refactors
// it cannot see are ones: an extraction into another file, an existing component swapped in. The
// window replaces its judgement with a deterministic check at both ends.
//
//   node .claude/hooks/refactor.mjs open <test path>...   the named tests must pass, with no test
//                                                         file changed since HEAD; the guarded
//                                                         files are snapshotted
//   node .claude/hooks/refactor.mjs close                 the same tests, `tsc --noEmit -p .` and
//                                                         ESLint on the changed files; any failure
//                                                         restores the snapshot
//   node .claude/hooks/refactor.mjs status
//
// While a window is open, probity.sh lets a write to that checkout through unjudged, except a write
// to a test, which it judges as ever. A window lasts 30 minutes; after that probity judges again,
// and only `close` ends it.
//
// - The checkout is the one the command is run from (`git rev-parse --show-toplevel` of the working
//   directory), as probity.sh follows the checkout of the file. A window opened in a worktree is
//   that worktree's alone: its state lives in the worktree's own git dir.
// - The tools are the checkout's own node_modules/.bin/{jest,tsc,eslint}, so the tests can stand
//   them in, as they do probity.
// - The guarded set is the Bash guard's (`bash-write-guard.sh hashes`), which reads probity's
//   `files` globs. The snapshot is each file's blob, written to git's object store, so a restore
//   never depends on a copy elsewhere. A red close records what it restored as
//   `refactor-window-restored` in the git dir, so the guard does not take the rollback for a Bash
//   write and undo it.
// - REFACTOR_NOW, in seconds since the epoch, stands in for the clock (tests only).
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIFETIME = 30 * 60;
const GUARD = path.join(path.dirname(fileURLToPath(import.meta.url)), 'bash-write-guard.sh');
const TEST = /\.test\.tsx?$/;

const now = () => Number(process.env.REFACTOR_NOW ?? Math.floor(Date.now() / 1000));

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });

const refuse = (message) => {
  console.error(message);
  process.exit(1);
};

let root;
try {
  root = git(process.cwd(), 'rev-parse', '--show-toplevel').trim();
} catch {
  refuse('Not in a git checkout: run refactor.mjs from the checkout the refactor is in.');
}
const gitPath = (name) =>
  git(root, 'rev-parse', '--path-format=absolute', '--git-path', name).trim();
const STATE = gitPath('refactor-window');
const RESTORED = gitPath('refactor-window-restored');

/** Every guarded file's blob, by path; `write` also stores each blob in git's object store. */
const hashes = (write) => {
  const out = execFileSync('bash', [GUARD, 'hashes', root, ...(write ? ['-w'] : [])], {
    encoding: 'utf8',
  });
  return new Map(
    out
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split('\t')),
  );
};

/** Runs one of the checkout's own tools in the root, its output passed through as it is. */
const run = (tool, args) => {
  const { status } = spawnSync(path.join(root, 'node_modules/.bin', tool), args, {
    cwd: root,
    stdio: 'inherit',
  });
  return status === 0;
};

/**
 * Runs the named tests by their paths. Jest otherwise takes each as a pattern, and an Expo Router
 * group's parentheses, `app/(tabs)/…`, make one that matches no file: the run passes on the rest.
 */
const jest = (tests) => run('jest', [...tests, '--runTestsByPath']);

const readState = () => (existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : undefined);

/** The files, by path, whose blob differs between the snapshot and now. */
const changes = (before, after) =>
  [...new Set([...before.keys(), ...after.keys()])]
    .filter((p) => before.get(p) !== after.get(p))
    .sort();

/** Test files changed since HEAD, untracked ones included. */
const changedTests = () => {
  const entries = git(root, 'status', '--porcelain', '-z', '--untracked-files=all').split('\0');
  const paths = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    paths.push(entry.slice(3));
    // A rename or copy is followed by the path it came from.
    if (/^[RC]/.test(entry)) paths.push(entries[++i]);
  }
  return paths.filter((p) => TEST.test(p));
};

const open = (tests) => {
  const state = readState();
  if (state)
    refuse(
      `A refactor window is already open in ${root}, since ${new Date(state.openedAt * 1000).toISOString()}: close it first (node .claude/hooks/refactor.mjs close).`,
    );
  if (tests.length === 0)
    refuse(
      'Name the tests that cover the code: node .claude/hooks/refactor.mjs open <test path>...',
    );
  const changed = changedTests();
  if (changed.length > 0)
    refuse(
      `Refused: a window opens only on committed tests, and these differ from HEAD:\n${changed.map((p) => `  ${p}`).join('\n')}\nCommit them first.`,
    );
  if (!jest(tests)) refuse('Refused: the tests that cover the code must pass first.');
  const snapshot = gitPath('refactor-window-snapshot');
  writeFileSync(snapshot, [...hashes(true)].map(([p, blob]) => `${p}\t${blob}\n`).join(''));
  rmSync(RESTORED, { force: true });
  writeFileSync(STATE, JSON.stringify({ root, tests, openedAt: now(), snapshot }, null, 2));
  console.log(
    `Refactor window open in ${root} for ${LIFETIME / 60} minutes: probity lets production writes through unjudged, tests excepted.\nClose it with: node .claude/hooks/refactor.mjs close (it reruns ${tests.join(' ')}, tsc and ESLint, and rolls back if any fails).`,
  );
};

const close = () => {
  const state = readState();
  if (!state) refuse(`No refactor window is open in ${root}.`);
  const before = new Map(
    readFileSync(state.snapshot, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split('\t')),
  );
  const changed = changes(before, hashes(false));
  const linted = changed.filter((p) => existsSync(path.join(root, p)));
  const failed = [
    jest(state.tests) ? undefined : `the tests (${state.tests.join(' ')})`,
    run('tsc', ['--noEmit', '-p', '.']) ? undefined : 'the type check',
    linted.length === 0 || run('eslint', linted) ? undefined : `ESLint on ${linted.join(' ')}`,
  ].filter(Boolean);
  const end = () => {
    rmSync(STATE, { force: true });
    rmSync(state.snapshot, { force: true });
  };
  if (failed.length === 0) {
    end();
    console.log(
      `Refactor window closed in ${root}. Changed in it:\n${changed.map((p) => `  ${p}`).join('\n') || '  nothing'}`,
    );
    return;
  }
  for (const p of changed) {
    const file = path.join(root, p);
    const blob = before.get(p);
    if (blob === undefined) {
      rmSync(file, { force: true });
    } else {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, execFileSync('git', ['cat-file', 'blob', blob], { cwd: root }));
    }
  }
  writeFileSync(RESTORED, changed.map((p) => `${p}\t${before.get(p) ?? ''}\n`).join(''));
  end();
  refuse(
    `Failed: ${failed.join(', ')}. The source was rolled back to the window's start, and the window is closed:\n${changed.map((p) => `  ${p}`).join('\n')}`,
  );
};

const status = () => {
  const state = readState();
  if (!state) {
    console.log(`No refactor window is open in ${root}.`);
    return;
  }
  const left = state.openedAt + LIFETIME - now();
  console.log(
    left > 0
      ? `A refactor window is open in ${root}, ${Math.ceil(left / 60)} minutes left, for ${state.tests.join(' ')}.`
      : `The refactor window in ${root} has expired: probity judges every write again. Close it (node .claude/hooks/refactor.mjs close) to keep or roll back what it changed.`,
  );
};

const [command, ...args] = process.argv.slice(2);
if (command === 'open') open(args);
else if (command === 'close') close();
else if (command === 'status') status();
else refuse('Usage: node .claude/hooks/refactor.mjs open <test path>... | close | status');
