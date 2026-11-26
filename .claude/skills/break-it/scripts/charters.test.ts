import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs';
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

  /** A repo whose change is `lines` new lines in `file`, stamped, with four charters registered. */
  const fourCharters = (file: string, lines: number, ...head: string[]) => {
    const { root } = repo();
    const git = (...args: string[]) => spawnSync('git', args, { cwd: root, env: ISOLATED });
    git('update-ref', 'refs/remotes/origin/main', 'HEAD');
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), 'const a = 1;\n'.repeat(lines));
    run(root, 'head', '8', ...head);
    for (let n = 1; n <= 4; n += 1) run(root, 'charter', '8', CHARTER);
    return root;
  };

  it('refuses a fifth charter on a change of 100 lines', () => {
    // Given a small change with four charters
    const root = fourCharters('src/a.ts', 100);

    // When a fifth is registered
    const { status, output } = run(root, 'charter', '8', CHARTER);

    // Then it is refused, saying how big the change is
    expect(status).toBe(1);
    expect(output).toContain('100 lines');
  });

  it('takes a fifth charter on a change of more than 100 lines', () => {
    // Given a larger change with four charters
    const root = fourCharters('app/a.tsx', 101);

    // When a fifth is registered
    const { output } = run(root, 'charter', '8', CHARTER);

    // Then it takes the next key
    expect(output.trim()).toBe('EX-8.5');
  });

  it.each([
    ['tests', 'src/a.test.ts'],
    ['what is not the app', 'docs/a.md'],
  ])('does not count %s as part of the change', (_, file) => {
    // Given a change of 500 lines that a user cannot meet
    const root = fourCharters(file, 500);

    // When a fifth charter is registered
    const { status } = run(root, 'charter', '8', CHARTER);

    // Then it is refused
    expect(status).toBe(1);
  });

  it('measures an epic, on main, from the commit it is given', () => {
    // Given an epic's change, already on main
    const { root } = repo();
    const git = (...args: string[]) =>
      spawnSync('git', args, { cwd: root, env: ISOLATED, encoding: 'utf8' }).stdout.trim();
    const before = git('rev-parse', 'HEAD');
    mkdirSync(path.join(root, 'src'));
    writeFileSync(path.join(root, 'src/a.ts'), 'const a = 1;\n'.repeat(300));
    git('add', '-A');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'epic');
    git('update-ref', 'refs/remotes/origin/main', 'HEAD');
    run(root, 'head', '8', '--base', before);
    for (let n = 1; n <= 4; n += 1) run(root, 'charter', '8', CHARTER);

    // When a fifth charter is registered
    const { output } = run(root, 'charter', '8', CHARTER);

    // Then it takes the next key
    expect(output.trim()).toBe('EX-8.5');
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

describe('charters.mjs gates', () => {
  const ALL = ['simplify', 'mutation-test', 'code-review', 'check-adrs', 'verify'];
  /** A repo whose five gates were each recorded on the code as it stands. */
  const gated = () => {
    const made = repo();
    for (const gate of ALL) run(made.root, 'gate', '8', gate);
    return made;
  };

  it('fails, naming each gate, when none was recorded', () => {
    // Given an issue no gate was recorded for
    const { root } = repo();

    // When its gates are checked
    const { status, output } = run(root, 'gates', '8');

    // Then it fails, and names every gate as missing
    expect(status).toBe(1);
    for (const gate of ALL) expect(output).toContain(`${gate} missing`);
  });

  it('passes when every gate was recorded on the code as it stands', () => {
    // Given an issue whose five gates were recorded on this code
    const { root } = gated();

    // When its gates are checked
    const { status, output } = run(root, 'gates', '8');

    // Then it passes
    expect(status).toBe(0);
    expect(output).toContain('5 gates, every one on this code');
  });

  it('fails a gate recorded before the code changed, naming it', () => {
    // Given five gates recorded, then a fix made after them
    const { root } = gated();
    writeFileSync(path.join(root, 'a.ts'), 'export const a = 2;\n');
    run(root, 'gate', '8', 'verify');

    // When its gates are checked
    const { status, output } = run(root, 'gates', '8');

    // Then the four run before the fix are to run again, and verify is not
    expect(status).toBe(1);
    expect(output).toContain('code-review stale');
    expect(output).toContain('verify ok');
  });

  it('refuses a gate it does not know', () => {
    // Given a repo
    const { root } = repo();

    // When a gate of another name is recorded
    const { status, output } = run(root, 'gate', '8', 'review');

    // Then it is refused, with the names it takes
    expect(status).toBe(1);
    expect(output).toContain('check-adrs');
  });

  it('refuses verify on photographs older than the code they are of', () => {
    // Given a photograph taken, then the code changed
    const { root, shot } = repo();
    const old = new Date(Date.now() - 60_000);
    utimesSync(shot, old, old);
    writeFileSync(path.join(root, 'a.ts'), 'export const a = 2;\n');

    // When verify is recorded on that photograph's folder
    const { status, output } = run(root, 'gate', '8', 'verify', '--photos', path.dirname(shot));

    // Then it is refused, naming the photograph
    expect(status).toBe(1);
    expect(output).toContain('shot.png');
  });

  it('takes verify on photographs newer than the code', () => {
    // Given the code changed, then a photograph taken
    const { root, shot } = repo();
    const old = new Date(Date.now() - 60_000);
    writeFileSync(path.join(root, 'a.ts'), 'export const a = 2;\n');
    utimesSync(path.join(root, 'a.ts'), old, old);
    writeFileSync(shot, 'png');

    // When verify is recorded on its folder
    const { status } = run(root, 'gate', '8', 'verify', '--photos', path.dirname(shot));

    // Then it is taken
    expect(status).toBe(0);
  });
});
