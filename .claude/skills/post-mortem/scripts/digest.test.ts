import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPT = path.join(__dirname, 'digest.mjs');

type Line = Record<string, unknown>;

const user = (content: unknown): Line => ({ type: 'user', message: { role: 'user', content } });
const calls = (id: string, name: string, input: unknown): Line => ({
  type: 'assistant',
  message: { role: 'assistant', content: [{ type: 'tool_use', id, name, input }] },
});
const result = (id: string, content: string, isError = false): Line =>
  user([{ type: 'tool_result', tool_use_id: id, content, is_error: isError }]);

/** A home directory holding one session's transcript for `/repo`, and its agents'. */
const home = (session: Line[], agents: Record<string, Line[]> = {}) => {
  const root = mkdtempSync(path.join(tmpdir(), 'digest-'));
  const project = path.join(root, '.claude/projects/-repo');
  const subagents = path.join(project, 's1/subagents');
  mkdirSync(subagents, { recursive: true });
  const jsonl = (lines: Line[]) => lines.map((line) => JSON.stringify(line)).join('\n') + '\n';
  writeFileSync(path.join(project, 's1.jsonl'), jsonl(session));
  for (const [id, lines] of Object.entries(agents)) {
    writeFileSync(path.join(subagents, `agent-${id}.jsonl`), jsonl(lines));
    writeFileSync(
      path.join(subagents, `agent-${id}.meta.json`),
      JSON.stringify({ agentType: 'break-it-tester' }),
    );
  }
  return root;
};

const digest = (root: string, ...args: string[]) => {
  const { status, stdout, stderr } = spawnSync('node', [SCRIPT, '--repo', '/repo', ...args], {
    env: { ...process.env, HOME: root },
    encoding: 'utf8',
  });
  return { status, output: stdout + stderr };
};

describe('digest.mjs', () => {
  it('lists what the user said, with its line', () => {
    // Given a session whose second line is the user's
    const root = home([calls('a', 'Bash', {}), user('file is deleted, commit and push it')]);

    // When it is digested
    const { output } = digest(root);

    // Then the turn is there, at its line
    expect(output).toContain('2 user: file is deleted, commit and push it');
  });

  it('lists a tool call that failed, with what it ran', () => {
    // Given a command that failed
    const root = home([
      calls('a', 'Bash', { command: 'npx jest' }),
      result('a', 'Exit code 1\n1 failed', true),
    ]);

    // When the session is digested
    const { output } = digest(root);

    // Then the failure is there, with the call that made it
    expect(output).toContain('2 error: Bash npx jest => Exit code 1');
  });

  it('lists a hook that refused', () => {
    // Given a hook's refusal, as the harness records one
    const root = home([
      {
        type: 'attachment',
        attachment: {
          type: 'hook_blocking_error',
          hookName: 'PostToolUse:Bash',
          blockingError: {
            blockingError: '[guard.sh]: Rolled back production code',
            command: 'guard.sh',
          },
        },
      },
    ]);

    // When the session is digested
    const { output } = digest(root);

    // Then the refusal is there, named for its hook
    expect(output).toContain('1 hook: PostToolUse:Bash Rolled back production code');
  });

  it('lists what the user said while the session was working', () => {
    // Given a message that arrived mid-turn
    const root = home([
      { type: 'attachment', attachment: { type: 'queued_command', prompt: 'leave it headless' } },
    ]);

    // When the session is digested
    const { output } = digest(root);

    // Then it counts as theirs
    expect(output).toContain('1 user: leave it headless');
  });

  it.each([
    ['a turn', user('<task-notification> <task-id>b1</task-id>')],
    [
      'a message mid-turn',
      {
        type: 'attachment',
        attachment: { type: 'queued_command', prompt: '<task-notification> <task-id>b1</task-id>' },
      },
    ],
  ])('never puts a notification in the user’s mouth, as %s', (_, line) => {
    // Given a background task's notification
    const root = home([line]);

    // When the session is digested
    const { output } = digest(root);

    // Then the user said nothing
    expect(output).not.toContain('user:');
  });

  it('leaves out a call that succeeded', () => {
    // Given a command that passed
    const root = home([calls('a', 'Bash', { command: 'ls' }), result('a', 'app')]);

    // When the session is digested
    const { output } = digest(root);

    // Then there is nothing to say about it
    expect(output).not.toContain('Bash ls');
  });

  it('digests each agent the session spawned, under its type', () => {
    // Given a session that spawned a tester, which met an error
    const root = home([], {
      x1: [calls('a', 'Bash', { command: 'adb root' }), result('a', 'error: closed', true)],
    });

    // When the session is digested
    const { output } = digest(root);

    // Then the agent and its error are there
    expect(output).toMatch(/break-it-tester .*agent-x1\.jsonl/);
    expect(output).toContain('2 error: Bash adb root => error: closed');
  });

  it('keeps each entry to one line, however long it was', () => {
    // Given a long, many-lined turn
    const root = home([user(`first\n${'x'.repeat(2000)}`)]);

    // When the session is digested
    const { output } = digest(root);

    // Then it is one short line
    const line = output.split('\n').find((each) => each.includes('1 user:'))!;
    expect(line).toContain('first xxx');
    expect(line.length).toBeLessThan(400);
  });

  it('skips a line it cannot read, as a session still being written leaves one', () => {
    // Given a transcript cut off mid-line
    const root = home([user('hello')]);
    const file = path.join(root, '.claude/projects/-repo/s1.jsonl');
    writeFileSync(file, `${JSON.stringify(user('hello'))}\n{"type":"us`);

    // When the session is digested
    const { status, output } = digest(root);

    // Then the rest is still there
    expect(status).toBe(0);
    expect(output).toContain('1 user: hello');
  });

  it('stops when the session named is not there', () => {
    // Given one session
    const root = home([]);

    // When another is asked for
    const { status, output } = digest(root, 's9');

    // Then it says so
    expect(status).toBe(1);
    expect(output).toContain('no transcript for session s9');
  });
});
