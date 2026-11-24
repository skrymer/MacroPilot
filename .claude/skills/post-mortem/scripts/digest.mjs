// What a session cost, in one line each: what the user said, each tool call that failed, and each
// hook that refused, with its line in the transcript, and how long it and its longest calls took; then the same for every agent it spawned.
//
//   digest.mjs [<session-id>] [--repo <path>]     the newest session of this checkout by default
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';

const WIDTH = 300;

const oneLine = (text) => text.replace(/\s+/g, ' ').trim().slice(0, WIDTH);

/** The text of a message's content, which is a string or a list of blocks. */
const textOf = (content) =>
  typeof content === 'string'
    ? content
    : (content ?? [])
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join(' ');

const inputOf = (input) => input?.command ?? input?.file_path ?? JSON.stringify(input ?? {});

// Written by the harness in the user's place, so nothing the user said.
const HARNESS =
  /^\s*(<system-reminder|<task-notification|\[SYSTEM NOTIFICATION|Another Claude session|Base directory for this skill|Tool loaded|\[Image:|<local-command|Caveat:)/;

function parse(file) {
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((line, i) => {
      try {
        return { number: i + 1, ...JSON.parse(line) };
      } catch {
        return undefined; // a session still being written ends mid-line
      }
    })
    .filter(Boolean);
}

function entries(file) {
  const calls = new Map();
  const found = [];
  for (const line of parse(file)) {
    const content = line.message?.content;
    const blocks = Array.isArray(content) ? content : [];
    for (const block of blocks) {
      if (block.type === 'tool_use') calls.set(block.id, `${block.name} ${inputOf(block.input)}`);
      if (block.type === 'tool_result' && block.is_error) {
        const call = oneLine(calls.get(block.tool_use_id) ?? 'unknown call').slice(0, WIDTH / 2);
        found.push(`${line.number} error: ${call} => ${oneLine(textOf(block.content))}`);
      }
    }
    const { attachment } = line;
    if (attachment?.type === 'hook_blocking_error') {
      const { hookName, blockingError } = attachment;
      // The harness puts the whole hook command in front of what the hook said.
      const said = (blockingError?.blockingError ?? '').replace(
        `[${blockingError?.command}]: `,
        '',
      );
      found.push(`${line.number} hook: ${oneLine(`${hookName} ${said}`)}`);
    }
    const turn =
      attachment?.type === 'queued_command'
        ? attachment.prompt
        : line.type === 'user' && !line.isMeta
          ? content
          : undefined;
    const said = textOf(turn);
    if (said.trim() && !HARNESS.test(said)) found.push(`${line.number} user: ${oneLine(said)}`);
  }
  return found;
}

const seconds = (from, to) => Math.round((to - from) / 1000);

/** How long a transcript ran, how much of it was inside tool calls, and its longest calls. */
function durations(file) {
  const open = new Map();
  const done = [];
  const times = [];
  for (const line of parse(file)) {
    const at = Date.parse(line.timestamp);
    if (Number.isNaN(at)) continue;
    times.push(at);
    const blocks = Array.isArray(line.message?.content) ? line.message.content : [];
    for (const block of blocks) {
      if (block.type === 'tool_use') {
        const call = oneLine(`${block.name} ${inputOf(block.input)}`).slice(0, WIDTH / 2);
        open.set(block.id, { number: line.number, from: at, call });
      }
      const started = block.type === 'tool_result' && open.get(block.tool_use_id);
      if (started) done.push({ ...started, to: at });
    }
  }
  if (times.length === 0) return [];
  // Calls run at once overlap, and their time is counted once.
  let inCalls = 0;
  let reached = -Infinity;
  for (const { from, to } of done.sort((a, b) => a.from - b.from)) {
    inCalls += Math.max(0, to - Math.max(from, reached));
    reached = Math.max(reached, to);
  }
  const longest = [...done].sort((a, b) => b.to - b.from - (a.to - a.from)).slice(0, 5);
  const took = times.reduce((a, b) => Math.max(a, b)) - times.reduce((a, b) => Math.min(a, b));
  return [
    `${seconds(0, took)} s in all, ${seconds(0, inCalls)} s in tool calls`,
    ...longest.map(
      ({ number, from, to, call }) => `${number} took ${seconds(from, to)} s: ${call}`,
    ),
  ];
}

const print = (heading, file) => {
  console.log(`\n## ${heading} ${file}`);
  for (const entry of durations(file)) console.log(entry);
  for (const entry of entries(file)) console.log(entry);
};

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { repo: { type: 'string' } },
});
const repo = path.resolve(values.repo ?? process.cwd());
const project = path.join(homedir(), '.claude/projects', repo.replace(/[^A-Za-z0-9]/g, '-'));
const newest = () =>
  existsSync(project)
    ? readdirSync(project)
        .filter((name) => name.endsWith('.jsonl'))
        .sort(
          (a, b) =>
            statSync(path.join(project, b)).mtimeMs - statSync(path.join(project, a)).mtimeMs,
        )
        .map((name) => name.replace(/\.jsonl$/, ''))[0]
    : undefined;
const session = positionals[0] ?? newest();
const transcript = path.join(project, `${session}.jsonl`);

if (!session || !existsSync(transcript)) {
  console.error(`no transcript for session ${session ?? '(any)'} under ${project}`);
  process.exit(1);
}

print('session', transcript);
const agents = path.join(project, session, 'subagents');
if (existsSync(agents)) {
  for (const name of readdirSync(agents).filter((each) => each.endsWith('.jsonl'))) {
    const meta = path.join(agents, name.replace(/\.jsonl$/, '.meta.json'));
    const type = existsSync(meta) ? JSON.parse(readFileSync(meta, 'utf8')).agentType : 'agent';
    print(type, path.join(agents, name));
  }
}
