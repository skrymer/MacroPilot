import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPT = path.join(__dirname, 'charters.mjs');
const CHARTER = 'explore the log form with a double tap to discover a duplicate entry';

/** The environment without git's own variables, which a git hook sets and git obeys over the cwd. */
const ISOLATED = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
);

/** A git repo holding one committed file, and evidence of each kind outside it. */
const repo = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'charters-'));
  const git = (...args: string[]) => spawnSync('git', args, { cwd: root, env: ISOLATED });
  git('init', '-q');
  writeFileSync(path.join(root, 'a.ts'), 'export const a = 1;\n');
  git('add', '-A');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'a');
  const shot = path.join(mkdtempSync(path.join(tmpdir(), 'shot-')), 'shot.png');
  writeFileSync(shot, 'png');
  const snapshot = path.join(path.dirname(shot), 'snapshot.txt');
  writeFileSync(snapshot, '@e2 [group] "Today" [selected]\n');
  const empty = path.join(path.dirname(shot), 'empty.txt');
  writeFileSync(empty, '');
  return { root, shot, snapshot, empty };
};

const run = (root: string, ...args: string[]) => {
  const { status, stdout, stderr } = spawnSync('node', [SCRIPT, ...args], {
    cwd: root,
    env: ISOLATED,
    encoding: 'utf8',
  });
  return { status, output: stdout + stderr };
};

/** A repo stamped for issue 8, with one charter registered. */
const chartered = () => {
  const made = repo();
  run(made.root, 'head', '8');
  run(made.root, 'charter', '8', CHARTER);
  return made;
};

describe('charters.mjs', () => {
  it('numbers each charter within its issue', () => {
    // Given an issue with one charter already
    const { root } = chartered();

    // When another is registered
    const { output } = run(root, 'charter', '8', CHARTER);

    // Then it takes the next key
    expect(output.trim()).toBe('EX-8.2');
  });

  it('refuses a charter that names no risk', () => {
    // Given a stamped issue
    const { root } = chartered();

    // When a charter without a risk is registered
    const { status, output } = run(root, 'charter', '8', 'explore the log form with a double tap');

    // Then it is refused, with the form a charter takes
    expect(status).toBe(1);
    expect(output).toContain('to discover');
  });

  it('fails the check when nothing was explored', () => {
    // Given a stamped issue with no charter
    const { root } = repo();
    run(root, 'head', '8');

    // When it is checked
    const { status, output } = run(root, 'check', '8');

    // Then it is incomplete
    expect(status).toBe(1);
    expect(output).toContain('no charter');
  });

  it('fails the check on a charter with no result, naming it', () => {
    // Given a charter nobody drove
    const { root } = chartered();

    // When the issue is checked
    const { status, output } = run(root, 'check', '8');

    // Then it is incomplete, and the charter is named
    expect(status).toBe(1);
    expect(output).toContain(`EX-8.1 missing: ${CHARTER}`);
  });

  it('passes the check once every charter has a result, a failing one included', () => {
    // Given a charter driven to a failure
    const { root, shot } = chartered();
    run(root, 'record', 'EX-8.1', 'fail', '--screenshot', shot, '--note', 'two rows, 60 ms apart');

    // When the issue is checked
    const { status, output } = run(root, 'check', '8');

    // Then the exploration is complete, and the failure and its note are shown
    expect(status).toBe(0);
    expect(output).toContain('EX-8.1 fail');
    expect(output).toContain('two rows, 60 ms apart');
  });

  it('shows the latest result of a charter driven twice', () => {
    // Given a charter blocked, then driven to a pass
    const { root, shot } = chartered();
    run(root, 'record', 'EX-8.1', 'blocked', '--note', 'Metro was down');
    run(root, 'record', 'EX-8.1', 'pass', '--screenshot', shot, '--note', 'one row');

    // When the issue is checked
    const { output } = run(root, 'check', '8');

    // Then only the pass stands
    expect(output).toContain('EX-8.1 pass');
    expect(output).not.toContain('blocked');
  });

  it.each([
    ['no note', ['pass', '--screenshot', 'SHOT'], 'note'],
    ['neither a snapshot nor a screenshot', ['pass', '--note', 'one row'], '--snapshot'],
    ['an empty snapshot', ['pass', '--snapshot', 'EMPTY', '--note', 'one row'], 'empty'],
    [
      'evidence that does not exist',
      ['fail', '--screenshot', '/nowhere.png', '--note', 'x'],
      'does not exist',
    ],
    ['an unknown status', ['skipped', '--note', 'x'], 'status'],
  ])('refuses a result with %s', (_, args, named) => {
    // Given a registered charter
    const { root, shot, empty } = chartered();
    const files: Record<string, string> = { SHOT: shot, EMPTY: empty };

    // When a result lacking what makes it evidence is recorded
    const { status, output } = run(
      root,
      'record',
      'EX-8.1',
      ...args.map((arg) => files[arg] ?? arg),
    );

    // Then it is refused, saying what is wrong
    expect(status).toBe(1);
    expect(output).toContain(named);
  });

  it('takes a snapshot as evidence, and shows where it is', () => {
    // Given a registered charter, and the accessibility tree it ended on
    const { root, snapshot } = chartered();

    // When a pass is recorded with the snapshot
    run(root, 'record', 'EX-8.1', 'pass', '--snapshot', snapshot, '--note', 'one row');

    // Then the result stands, and names its evidence
    const { status, output } = run(root, 'check', '8');
    expect(status).toBe(0);
    expect(output).toContain(snapshot);
  });

  it('takes a blocked result without evidence, since there may be no screen', () => {
    // Given a registered charter
    const { root } = chartered();

    // When it is recorded blocked
    const { status } = run(root, 'record', 'EX-8.1', 'blocked', '--note', 'Metro was down');

    // Then it is kept
    expect(status).toBe(0);
  });

  it('refuses a result for a charter nobody registered', () => {
    // Given an issue with one charter
    const { root, shot } = chartered();

    // When a result is recorded for a second
    const { status } = run(root, 'record', 'EX-8.2', 'pass', '--screenshot', shot, '--note', 'x');

    // Then it is refused
    expect(status).toBe(1);
  });

  it.each([
    ['a tracked file edited', 'a.ts'],
    ['an untracked file added', 'b.ts'],
  ])('refuses a result once the code has changed, by %s', (_, file) => {
    // Given a charter registered on the stamped code
    const { root, shot } = chartered();
    writeFileSync(path.join(root, file), 'export const a = 2;\n');

    // When a result is recorded on other code
    const { status, output } = run(
      root,
      'record',
      'EX-8.1',
      'pass',
      '--screenshot',
      shot,
      '--note',
      'x',
    );

    // Then it is refused, since it would be evidence for code that was not driven
    expect(status).toBe(1);
    expect(output).toContain('head');
  });

  it('drops the results of other code when stamped again', () => {
    // Given a driven charter, and the code then changed
    const { root, shot } = chartered();
    run(root, 'record', 'EX-8.1', 'pass', '--screenshot', shot, '--note', 'x');
    writeFileSync(path.join(root, 'a.ts'), 'export const a = 2;\n');

    // When the code is stamped again
    run(root, 'head', '8');

    // Then the charter and its result are gone
    expect(run(root, 'check', '8').output).toContain('no charter');
  });

  it('keeps the results when stamped again on the same code', () => {
    // Given a driven charter
    const { root, shot } = chartered();
    run(root, 'record', 'EX-8.1', 'pass', '--screenshot', shot, '--note', 'x');

    // When the same code is stamped again
    run(root, 'head', '8');

    // Then the result stands
    expect(run(root, 'check', '8').status).toBe(0);
  });

  it('leaves the checkout and its index as they were', () => {
    // Given a repo with an untracked file
    const { root } = repo();
    writeFileSync(path.join(root, 'b.ts'), 'export const b = 1;\n');

    // When the code is stamped
    run(root, 'head', '8');

    // Then git still sees only the untracked file
    const status = spawnSync('git', ['status', '--short'], {
      cwd: root,
      env: ISOLATED,
      encoding: 'utf8',
    });
    expect(status.stdout).toBe('?? b.ts\n');
  });
});
