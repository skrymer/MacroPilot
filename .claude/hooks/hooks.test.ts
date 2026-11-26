import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const LINT = path.join(__dirname, 'lint-edited-file.sh');
const PROBITY = path.join(__dirname, 'probity.sh');
const GUARD = path.join(__dirname, 'bash-write-guard.sh');
const GATE = path.join(__dirname, 'gate-pipe-guard.sh');
const CONFIG = path.join(__dirname, '../../probity.config.ts');

/**
 * The environment without git's own variables, which a git hook sets and git obeys over the working
 * directory: the throwaway checkouts below would otherwise act on the real repo.
 */
const ISOLATED = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
);

/** What every throwaway checkout's `src/a.ts` starts as. */
const ORIGINAL = 'export const a = 1;\n';

/** A fresh directory. */
const directory = (name: string) => mkdtempSync(path.join(tmpdir(), `${name}-`));

/**
 * A git checkout holding `src/a.ts`, and in `node_modules/.bin` each named tool as a stand-in that
 * reports where it ran, what CLAUDE_PROJECT_DIR it saw and what it was handed, and refuses.
 */
const checkout = (tools: string[]) => {
  const root = directory('checkout');
  spawnSync('git', ['init', '-q'], { cwd: root, env: ISOLATED });
  mkdirSync(path.join(root, 'src'));
  writeFileSync(path.join(root, 'src/a.ts'), ORIGINAL);
  mkdirSync(path.join(root, 'node_modules/.bin'), { recursive: true });
  for (const tool of tools) {
    standIn(
      root,
      tool,
      `echo "${tool} ran in $PWD for $CLAUDE_PROJECT_DIR with $* <$(cat)>" >&2\nexit 2`,
    );
  }
  return root;
};

/** Installs `body` as the bash script `node_modules/.bin/<name>` in `root`. */
const standIn = (root: string, name: string, body: string) => {
  const bin = path.join(root, 'node_modules/.bin', name);
  writeFileSync(bin, `#!/usr/bin/env bash\n${body}\n`);
  chmodSync(bin, 0o755);
};

/** Runs a hook script as Claude Code does: `input` on stdin, from a session in `projectDir`. */
const runHook = (
  script: string,
  args: string[],
  input: string,
  projectDir: string,
  env: Record<string, string> = {},
) =>
  spawnSync(script, args, {
    cwd: projectDir,
    input,
    env: { ...ISOLATED, CLAUDE_PROJECT_DIR: projectDir, ...env },
    encoding: 'utf8',
  });

/** Runs a hook on an Edit of `filePath`, from a session in `projectDir`. */
const hook = (script: string, filePath: string, projectDir: string) => {
  const input = JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: filePath } });
  const { status, stderr } = runHook(script, [], input, projectDir);
  return { status, stderr, input };
};

describe('lint-edited-file.sh', () => {
  it('lints a file with the ESLint of the checkout it is in, not the session’s', () => {
    // Given a file in a worktree, edited from a session started in another checkout
    const worktree = checkout(['eslint']);
    const session = checkout(['eslint']);

    // When the hook runs on it
    const { status, stderr } = hook(LINT, path.join(worktree, 'src/a.ts'), session);

    // Then the worktree's own ESLint linted it, from the worktree's root
    expect(status).toBe(2);
    expect(stderr).toContain(`eslint ran in ${worktree} for`);
  });

  it('says so, rather than passing, when the file’s checkout has no ESLint', () => {
    // Given a file in a checkout where npm ci has not run
    const worktree = checkout([]);

    // When the hook runs on it
    const { status, stderr } = hook(LINT, path.join(worktree, 'src/a.ts'), checkout(['eslint']));

    // Then the edit is reported as unlinted
    expect(status).toBe(2);
    expect(stderr).toContain(`No ESLint in ${worktree}`);
  });
});

/** Every hook command `.claude/settings.json` configures, as Claude Code runs it. */
const configuredCommands = (): string[] => {
  const settings = JSON.parse(readFileSync(path.join(__dirname, '../settings.json'), 'utf8')) as {
    hooks: Record<string, { hooks: { command: string }[] }[]>;
  };
  return Object.values(settings.hooks).flatMap((matchers) =>
    matchers.flatMap((matcher) => matcher.hooks.map((hook) => hook.command)),
  );
};

describe('.claude/settings.json', () => {
  it.each(['bash-write-guard.sh', 'gate-pipe-guard.sh'])('registers %s', (script) => {
    // Given a guard on Bash

    // When the configured hooks are listed
    const commands = configuredCommands().join('\n');

    // Then it is among them
    expect(commands).toContain(script);
  });

  it.each(configuredCommands())(
    'refuses, rather than letting the tool call through, when its script is gone: %s',
    (command) => {
      // Given the session's project directory gone, as when its worktree is removed mid-session
      const projectDir = path.join(directory('removed'), 'worktree');

      // When Claude Code runs the hook command
      const { status, stderr } = spawnSync('bash', ['-c', command], {
        cwd: directory('session'),
        input: '{}',
        env: { ...ISOLATED, CLAUDE_PROJECT_DIR: projectDir },
        encoding: 'utf8',
      });

      // Then it refuses, saying the hook is missing
      expect(status).toBe(2);
      expect(stderr).toContain(`hook missing: ${projectDir}/.claude/hooks/`);
    },
  );

  it.each(configuredCommands())(
    'runs its script, with its arguments and the tool call, when the script is there: %s',
    (command) => {
      // Given a project whose hook scripts each report what they were handed, and allow
      const projectDir = directory('project');
      mkdirSync(path.join(projectDir, '.claude/hooks'), { recursive: true });
      for (const script of [
        'probity.sh',
        'bash-write-guard.sh',
        'gate-pipe-guard.sh',
        'lint-edited-file.sh',
      ]) {
        const file = path.join(projectDir, '.claude/hooks', script);
        writeFileSync(file, `#!/usr/bin/env bash\necho "${script} $* <$(cat)>" >&2\n`);
        chmodSync(file, 0o755);
      }

      // When Claude Code runs the hook command
      const { status, stderr } = spawnSync('bash', ['-c', command], {
        cwd: projectDir,
        input: '{"tool_name":"Edit"}',
        env: { ...ISOLATED, CLAUDE_PROJECT_DIR: projectDir },
        encoding: 'utf8',
      });

      // Then the script ran, handed the tool call, and its verdict stands
      expect(status).toBe(0);
      expect(stderr).toMatch(/\.sh (pre|post)? <\{"tool_name":"Edit"\}>/);
    },
  );
});

describe('probity.sh', () => {
  it('judges a file with the probity of the checkout it is in, run from there, handed the tool call', () => {
    // Given a file in a worktree, edited from a session started in another checkout
    const worktree = checkout(['probity']);
    const session = checkout(['probity']);

    // When the hook runs on it
    const { status, stderr, input } = hook(PROBITY, path.join(worktree, 'src/a.ts'), session);

    // Then the worktree's own probity judged it, from the worktree, handed the tool call whole
    expect(status).toBe(2);
    expect(stderr).toContain(`probity ran in ${worktree} for`);
    expect(stderr).toContain(`with --agent claude-code <${input}>`);
  });

  it('finds the checkout of a file being created in a directory that does not exist yet', () => {
    // Given a new file in a worktree, under a directory the write will create
    const worktree = checkout(['probity']);

    // When the hook runs on it
    const { stderr } = hook(PROBITY, path.join(worktree, 'src/new/b.ts'), checkout(['probity']));

    // Then the worktree's probity judged it
    expect(stderr).toContain(`probity ran in ${worktree} for`);
  });

  it('refuses the edit, rather than letting it through unjudged, when the checkout has no probity', () => {
    // Given a file in a checkout where npm ci has not run
    const worktree = checkout([]);

    // When the hook runs on it
    const { status, stderr } = hook(
      PROBITY,
      path.join(worktree, 'src/a.ts'),
      checkout(['probity']),
    );

    // Then the edit is refused, saying why
    expect(status).toBe(2);
    expect(stderr).toContain(`No probity in ${worktree}`);
  });

  it('refuses the edit, rather than letting it through unjudged, when probity itself fails', () => {
    // Given a checkout whose probity crashes, as a missing API key or a broken install would
    const worktree = checkout([]);
    standIn(worktree, 'probity', 'echo "probity: boom" >&2\nexit 1');

    // When the hook runs on an edit there
    const { status, stderr } = hook(PROBITY, path.join(worktree, 'src/a.ts'), worktree);

    // Then the edit is refused, with probity's own words and why
    expect(status).toBe(2);
    expect(stderr).toContain('probity: boom');
    expect(stderr).toContain('probity failed (exit 1)');
  });

  /**
   * A transcript whose one message made two edits, `first` and `second`, each line one content block as
   * Claude Code writes it, and a checkout whose probity refuses `src/a.ts` alone.
   */
  const message = () => {
    const root = checkout([]);
    standIn(
      root,
      'probity',
      'input="$(cat)"; echo "probity ran" >&2; case "$input" in *src/a.ts*) exit 2 ;; esac; exit 0',
    );
    const transcript = path.join(directory('transcript'), 'session.jsonl');
    const block = (id: string) =>
      JSON.stringify({
        type: 'assistant',
        message: { id: 'msg_1', content: [{ type: 'tool_use', id, name: 'Edit' }] },
      });
    writeFileSync(transcript, `${block('first')}\n${block('second')}\n`);
    const edit = (id: string, file: string) =>
      runHook(
        PROBITY,
        [],
        JSON.stringify({
          session_id: randomUUID(),
          transcript_path: transcript,
          tool_name: 'Edit',
          tool_use_id: id,
          tool_input: { file_path: path.join(root, file) },
        }),
        root,
      );
    return { root, transcript, edit };
  };

  it('refuses an edit sent in the same message as one it refused, unjudged', () => {
    // Given a message of two edits, the first refused
    const { edit } = message();
    edit('first', 'src/a.ts');

    // When the hook runs on the second
    const { status, stderr } = edit('second', 'src/b.ts');

    // Then it is refused without being judged, saying why
    expect(status).toBe(2);
    expect(stderr).not.toContain('probity ran');
    expect(stderr).toContain('same message');
  });

  it('judges an edit of a later message as it would any other', () => {
    // Given a refused edit, then a later message with an edit of its own
    const { transcript, edit } = message();
    edit('first', 'src/a.ts');
    writeFileSync(
      transcript,
      `${readFileSync(transcript, 'utf8')}${JSON.stringify({
        type: 'assistant',
        message: { id: 'msg_2', content: [{ type: 'tool_use', id: 'third', name: 'Edit' }] },
      })}\n`,
    );

    // When the hook runs on it
    const { status, stderr } = edit('third', 'src/b.ts');

    // Then probity judges it, and lets it through
    expect(stderr).toContain('probity ran');
    expect(status).toBe(0);
  });
});

/** Runs git in `cwd`, committing as a throwaway identity. */
const git = (cwd: string, ...args: string[]) =>
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    cwd,
    env: ISOLATED,
    encoding: 'utf8',
  });

/** A checkout with this repo's real probity config and `src/a.ts`, committed. */
const guardedCheckout = () => {
  const root = checkout([]);
  copyFileSync(CONFIG, path.join(root, 'probity.config.ts'));
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'start');
  return root;
};

/**
 * Runs a Bash command as Claude Code does under the guard: the PreToolUse hook, the command from
 * `cwd`, then the PostToolUse hook, both handed the same tool call, from a session in `projectDir`.
 */
const guarded = (command: string, cwd: string, projectDir = cwd) => {
  const input = bashCall(command, cwd);
  const env = { TMPDIR: directory('guard-store') };
  runHook(GUARD, ['pre'], input, projectDir, env);
  spawnSync('bash', ['-c', command], { cwd, env: ISOLATED });
  return runHook(GUARD, ['post'], input, projectDir, env);
};

/** Commits `file` to `root`, holding what `src/a.ts` does. */
const commitFile = (root: string, file: string) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), ORIGINAL);
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '--allow-empty', '-m', file);
};

/** The hook input for a Bash tool call of `command` from `cwd`. */
const bashCall = (command: string, cwd: string) =>
  JSON.stringify({ tool_use_id: randomUUID(), cwd, tool_name: 'Bash', tool_input: { command } });

const read = (file: string) => readFileSync(file, 'utf8');
const srcA = (root: string) => read(path.join(root, 'src/a.ts'));

describe('bash-write-guard.sh', () => {
  it('rolls back a guarded file a Bash command wrote, and tells Claude to use Edit', () => {
    // Given a checkout whose src/a.ts probity guards
    const root = guardedCheckout();

    // When a Bash heredoc rewrites it
    const { status, stderr } = guarded(
      `python3 - <<'EOF'\nopen('src/a.ts', 'w').write('export const a = 2;\\n')\nEOF`,
      root,
    );

    // Then the file is back as it was, and Claude is told which file and why
    expect(srcA(root)).toBe(ORIGINAL);
    expect(status).toBe(2);
    expect(stderr).toContain('src/a.ts');
    expect(stderr).toContain('Edit');
  });

  it('removes a guarded file a Bash command created', () => {
    // Given a checkout with no src/new/b.ts
    const root = guardedCheckout();

    // When a Bash redirect creates it
    const { status, stderr } = guarded('mkdir -p src/new && echo "x" > src/new/b.ts', root);

    // Then it is gone again, and named
    expect(existsSync(path.join(root, 'src/new/b.ts'))).toBe(false);
    expect(status).toBe(2);
    expect(stderr).toContain('src/new/b.ts');
  });

  it.each([['src/a.ts'], ['app/(tabs)/old.tsx']])('lets Bash delete %s, a source file', (file) => {
    // Given a checkout holding a guarded source file
    const root = guardedCheckout();
    commitFile(root, file);

    // When Bash deletes it, as a route move or a refactor does
    const { status } = guarded(`git rm -q '${file}'`, root);

    // Then it stays deleted
    expect(status).toBe(0);
    expect(existsSync(path.join(root, file))).toBe(false);
  });

  it.each([
    ['a test', 'src/a.test.ts'],
    ['a screen’s test', 'app/day.test.tsx'],
    ['a lint rule', 'eslint-rules/touch-target.js'],
    ['the lint config', 'eslint.config.js'],
  ])('puts back %s that Bash deleted, and says to ask the user', (_, file) => {
    // Given a checkout holding a file that checks the others
    const root = guardedCheckout();
    commitFile(root, file);

    // When Bash deletes it
    const { status, stderr } = guarded(`git rm -q '${file}'`, root);

    // Then it is back, and Claude is told who can delete it
    expect(read(path.join(root, file))).toBe(ORIGINAL);
    expect(status).toBe(2);
    expect(stderr).toContain(`rm ${path.join(root, file)}`);
    expect(stderr).toContain('ask the user');
  });

  it('puts a source file back when Bash moved it, rather than lose it at both ends', () => {
    // Given a checkout whose src/a.ts probity guards
    const root = guardedCheckout();

    // When Bash moves it, creating a file probity never saw
    const { status } = guarded('git mv src/a.ts src/moved.ts', root);

    // Then it is where it was
    expect(status).toBe(2);
    expect(srcA(root)).toBe(ORIGINAL);
    expect(existsSync(path.join(root, 'src/moved.ts'))).toBe(false);
  });

  it('puts back a test that Bash moved away as source', () => {
    // Given a checkout holding a test
    const root = guardedCheckout();
    commitFile(root, 'src/a.test.ts');

    // When Bash renames it to something that is not one
    guarded('git mv src/a.test.ts src/b.ts', root);

    // Then the test is back, and what it was moved to is gone
    expect(read(path.join(root, 'src/a.test.ts'))).toBe(ORIGINAL);
    expect(existsSync(path.join(root, 'src/b.ts'))).toBe(false);
  });

  it('says nothing of deleting when a file was only changed', () => {
    // Given a checkout whose src/a.ts probity guards
    const root = guardedCheckout();

    // When Bash rewrites it
    const { stderr } = guarded('echo x > src/a.ts', root);

    // Then the message is about changing it
    expect(stderr).not.toContain('ask the user');
  });

  it('lets a Bash command revert a guarded file to HEAD', () => {
    // Given src/a.ts changed since HEAD, as an Edit would leave it
    const root = guardedCheckout();
    writeFileSync(path.join(root, 'src/a.ts'), 'export const a = 2;\n');

    // When git checkout reverts it
    const { status } = guarded('git checkout -- src/a.ts', root);

    // Then the revert stands
    expect(srcA(root)).toBe(ORIGINAL);
    expect(status).toBe(0);
  });

  it('leaves alone what probity does not guard', () => {
    // Given a checkout
    const root = guardedCheckout();
    const unguarded = [
      'CONTEXT.md',
      'docs/a.md',
      'tools/a.py',
      'node_modules/a.js',
      'app/design.tsx',
    ];

    // When Bash writes files outside probity's globs, and the design page it excludes
    const { status } = guarded(
      unguarded.map((file) => `mkdir -p $(dirname ${file}) && echo x > ${file}`).join(' && '),
      root,
    );

    // Then every write stands
    for (const file of unguarded) expect(read(path.join(root, file))).toBe('x\n');
    expect(status).toBe(0);
  });

  it.each(['npx prettier --write src/a.ts', 'npx eslint --fix src/a.ts'])(
    'lets a formatter run alone reformat a guarded file: %s',
    (command) => {
      // Given a formatter that rewrites src/a.ts
      const root = guardedCheckout();
      formatter(root, command.split(' ')[1]);

      // When it runs, alone
      const { status } = guarded(command, root);

      // Then its rewrite stands
      expect(srcA(root)).toBe('formatted\n');
      expect(status).toBe(0);
    },
  );

  it('refuses a write chained onto a formatter', () => {
    // Given a formatter
    const root = guardedCheckout();
    formatter(root, 'prettier');

    // When a write rides along with it
    const { status } = guarded('npx prettier --write src/a.ts && echo x > src/a.ts', root);

    // Then both are rolled back
    expect(srcA(root)).toBe(ORIGINAL);
    expect(status).toBe(2);
  });

  it('rolls back a write into another worktree than the one the command runs in', () => {
    // Given a session in one checkout, and a worktree of it beside
    const session = guardedCheckout();
    const worktree = path.join(directory('worktrees'), 'w');
    git(session, 'worktree', 'add', '-q', worktree);

    // When Bash writes into the worktree by its absolute path
    const { status, stderr } = guarded(`echo x > ${worktree}/src/a.ts`, session);

    // Then the worktree's file is back, and named by where it is
    expect(srcA(worktree)).toBe(ORIGINAL);
    expect(status).toBe(2);
    expect(stderr).toContain(path.join(worktree, 'src/a.ts'));
  });

  it('rolls back a write into a sibling worktree named by its directory', () => {
    // Given a session in one checkout, and a worktree of it beside
    const session = guardedCheckout();
    const worktree = path.join(path.dirname(session), `${path.basename(session)}-76`);
    git(session, 'worktree', 'add', '-q', worktree);

    // When Bash cd's into it by a relative path
    const { status } = guarded(`cd ../${path.basename(worktree)} && echo x > src/a.ts`, session);

    // Then the worktree's file is back
    expect(srcA(worktree)).toBe(ORIGINAL);
    expect(status).toBe(2);
  });

  it('leaves alone a worktree the command does not name, which another session may be editing', () => {
    // Given a worktree of the session's checkout, and its path kept where the command cannot see it
    const session = guardedCheckout();
    const worktree = path.join(directory('worktrees'), 'other');
    git(session, 'worktree', 'add', '-q', worktree);
    const pointer = path.join(directory('pointer'), 'target');
    writeFileSync(pointer, worktree);

    // When its file changes during the command, as another session's Edit would
    const { status } = guarded(`echo x > "$(cat ${pointer})/src/a.ts"`, session);

    // Then the change stands
    expect(srcA(worktree)).toBe('x\n');
    expect(status).toBe(0);
  });

  it('passes over a bare repo among the worktrees, even one holding a probity config', () => {
    // Given a worktree of a bare repo, as this repo's checkouts are, with a stray config in it
    const bare = path.join(directory('bare'), 'repo');
    git(guardedCheckout(), 'clone', '-q', '--bare', '.', bare);
    copyFileSync(CONFIG, path.join(bare, 'probity.config.ts'));
    const worktree = path.join(directory('worktrees'), 'w');
    git(bare, 'worktree', 'add', '-q', worktree);

    // When Bash writes into the worktree
    const { status, stderr } = guarded('echo x > src/a.ts', worktree);

    // Then the worktree's file is rolled back, with no complaint about the bare repo
    expect(srcA(worktree)).toBe(ORIGINAL);
    expect(status).toBe(2);
    expect(stderr).not.toContain('fatal');
  });

  it('reads the very globs probity enforces from probity.config.ts', () => {
    // Given the globs this repo's probity config exports, loaded by Node itself (the config imports
    // probity's ESM package, which Jest will not import)
    const files = JSON.parse(
      spawnSync(
        'node',
        [
          '--no-warnings',
          '--input-type=module',
          '-e',
          `import c from '${CONFIG}'; console.log(JSON.stringify(c.rules[0].files))`,
        ],
        { encoding: 'utf8' },
      ).stdout,
    );

    // When the guard reads it
    const { stdout } = spawnSync(GUARD, ['globs', path.dirname(CONFIG)], {
      input: '',
      encoding: 'utf8',
    });

    // Then it reads the same globs
    expect(stdout.trim().split('\n')).toEqual(files);
  });

  it('rolls nothing back when it took no snapshot before the command', () => {
    // Given a write the PreToolUse hook never saw, as when the hook is added mid-session
    const root = guardedCheckout();
    writeFileSync(path.join(root, 'src/a.ts'), 'export const a = 2;\n');

    // When only the PostToolUse hook runs
    const { status } = runHook(GUARD, ['post'], bashCall('true', root), root, {
      TMPDIR: directory('guard-store'),
    });

    // Then the write stands
    expect(srcA(root)).toBe('export const a = 2;\n');
    expect(status).toBe(0);
  });

  it('touches nothing in a checkout whose probity config the command removed', () => {
    // Given uncommitted work outside the guarded set
    const root = guardedCheckout();
    writeFileSync(path.join(root, 'CONTEXT.md'), 'draft\n');
    git(root, 'add', 'CONTEXT.md');
    git(root, 'commit', '-qm', 'context');
    writeFileSync(path.join(root, 'CONTEXT.md'), 'uncommitted\n');

    // When the command removes the config the guarded set comes from
    guarded('rm probity.config.ts', root);

    // Then the uncommitted work is still there
    expect(read(path.join(root, 'CONTEXT.md'))).toBe('uncommitted\n');
  });

  it('unstages a write it rolls back', () => {
    // Given a checkout
    const root = guardedCheckout();

    // When Bash writes a guarded file and stages it
    guarded('echo x > src/a.ts && git add src/a.ts', root);

    // Then nothing of the write is left staged either
    expect(git(root, 'diff', '--cached', '--name-only').stdout).toBe('');
  });

  it('names where the rolled-back version can be recovered from', () => {
    // Given a checkout
    const root = guardedCheckout();

    // When a Bash write is rolled back
    const { stderr } = guarded('echo recoverable > src/a.ts', root);

    // Then the message names a blob holding the Bash version
    const blob = stderr.match(/git cat-file -p ([0-9a-f]{40})/)?.[1] ?? '';
    expect(git(root, 'cat-file', '-p', blob).stdout).toBe('recoverable\n');
  });

  it('still refuses a write to a file the stopped merge did not touch', () => {
    // Given a merge stopped on a conflict in src/a.ts, and src/b.ts clean
    const root = guardedCheckout();
    writeFileSync(path.join(root, 'src/b.ts'), 'export const b = 1;\n');
    git(root, 'add', '-A');
    git(root, 'commit', '-qm', 'b');
    conflict(root);

    // When Bash rewrites src/b.ts while the merge is pending
    const { status } = guarded('echo x > src/b.ts', root);

    // Then that write is rolled back
    expect(read(path.join(root, 'src/b.ts'))).toBe('export const b = 1;\n');
    expect(status).toBe(2);
  });

  it('guards a file whose name git would quote', () => {
    // Given a guarded file with a non-ASCII name
    const root = guardedCheckout();
    writeFileSync(path.join(root, 'src/Ståned.ts'), ORIGINAL);
    git(root, 'add', '-A');
    git(root, 'commit', '-qm', 'å');

    // When Bash rewrites it
    guarded(`echo x > src/Ståned.ts`, root);

    // Then it is rolled back
    expect(read(path.join(root, 'src/Ståned.ts'))).toBe(ORIGINAL);
  });

  it('does not take a worktree for one whose name it merely begins with', () => {
    // Given a worktree whose name is a prefix of a path the command names
    const session = guardedCheckout();
    const worktree = path.join(directory('worktrees'), 'tree');
    git(session, 'worktree', 'add', '-q', worktree);

    const pointer = path.join(directory('pointer'), 'target');
    writeFileSync(pointer, worktree);

    // When its file changes, as another session's Edit would, during a command naming only tree-2
    const { status } = guarded(`echo x > "$(cat ${pointer})/src/a.ts"; ls ../tree-2`, session);

    // Then the change stands
    expect(srcA(worktree)).toBe('x\n');
    expect(status).toBe(0);
  });

  it('leaves a merge stopped on a conflict for Claude to resolve', () => {
    // Given a branch that changes src/a.ts one way and HEAD another
    const root = guardedCheckout();
    divergeOnSrcA(root);

    // When merging it stops on the conflict
    const { status } = guarded('git -c user.name=t -c user.email=t@t merge other', root);

    // Then the conflict markers stand
    expect(srcA(root)).toContain('<<<<<<<');
    expect(status).toBe(0);
  });
});

/** Commits src/a.ts one way on a branch `other` and another way on the current branch. */
const divergeOnSrcA = (root: string) => {
  git(root, 'checkout', '-qb', 'other');
  writeFileSync(path.join(root, 'src/a.ts'), 'export const a = 3;\n');
  git(root, 'commit', '-qam', 'other');
  git(root, 'checkout', '-q', '-');
  writeFileSync(path.join(root, 'src/a.ts'), 'export const a = 2;\n');
  git(root, 'commit', '-qam', 'ours');
};

/** Leaves `root` in a merge stopped on a conflict in src/a.ts. */
const conflict = (root: string) => {
  divergeOnSrcA(root);
  git(root, 'merge', 'other');
};

/** Installs, as `node_modules/.bin/<name>`, a stand-in formatter that rewrites src/a.ts. */
const formatter = (root: string, name: string) => standIn(root, name, 'echo formatted > src/a.ts');

describe('gate-pipe-guard.sh', () => {
  const gate = (command: string) => runHook(GATE, [], bashCall(command, '/tmp'), '/tmp');

  it.each([
    [
      'a suite piped before a commit',
      "npx jest 2>&1 | tail -5\ngit add -A\ngit commit -q -F - <<'E'\nx\nE",
    ],
    ['a lint piped before a push', 'npm run lint | head -3; git push'],
    ['the push itself piped', 'git push 2>&1 | tail -2'],
    ['a typecheck filtered before a commit', 'npm run -s typecheck | grep error; git commit -m x'],
    ['an errexit that a pipe swallows', 'set -e\nnpx jest | tail -1\ngit commit -m x'],
  ])('refuses %s', (_, command) => {
    // Given a command whose gate's own status a pipe throws away

    // When it is about to run
    const { status, stderr } = gate(command);

    // Then it is refused, and told to keep the status
    expect(status).toBe(2);
    expect(stderr).toContain('status');
  });

  it.each([
    [
      'a gate kept in a log',
      'npx jest >j.log 2>&1; echo $?; git push >p.log 2>&1; grep Tests: p.log',
    ],
    ['a gate piped with nothing shipped', 'npx jest 2>&1 | tail -5'],
    ['a gate piped under pipefail', 'set -o pipefail; npx jest | tail -5 && git commit -m x'],
    [
      'another command piped',
      'git commit -m x; git log --oneline | head -3; gh pr create | tail -1',
    ],
    ['a message that talks of it', 'git commit -m "never npx jest | tail && commit"'],
    ['a heredoc that talks of it', "git commit -F - <<'E'\nnever npx jest | tail\nE"],
  ])('lets through %s', (_, command) => {
    // Given a command that keeps every gate's status

    // When it is about to run
    const { status } = gate(command);

    // Then it runs
    expect(status).toBe(0);
  });
});
