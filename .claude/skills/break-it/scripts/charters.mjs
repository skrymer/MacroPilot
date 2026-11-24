// The break-it tester's charters and their results, kept inside .git so that recording one never
// changes the code it is evidence for.
//
//   charters.mjs head <issue>               stamps the code; rows recorded on other code are dropped
//   charters.mjs charter <issue> <charter>  registers "explore … with … to discover …", prints its key
//   charters.mjs record <key> pass|fail|blocked [--screenshot <file>] --note <text>
//   charters.mjs check <issue>              exits 1 on no charter, or on one with no result
import { execFileSync } from 'node:child_process';
import {
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
import { parseArgs } from 'node:util';

const FORM = /^explore\s+\S.*\swith\s+\S.*\sto discover\s+\S.*$/i;
const STATUSES = ['pass', 'fail', 'blocked'];

class Stop extends Error {}

const git = (args, env = process.env) =>
  execFileSync('git', args, { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** The tree of the working copy as it stands, untracked files included, without touching its index. */
function codeNow() {
  const dir = mkdtempSync(path.join(tmpdir(), 'code-'));
  try {
    const index = path.join(dir, 'index');
    const real = git(['rev-parse', '--git-path', 'index']);
    if (existsSync(real)) copyFileSync(real, index);
    const env = { ...process.env, GIT_INDEX_FILE: index };
    execFileSync('git', ['add', '-A', ':/'], { env, stdio: 'ignore' });
    return git(['write-tree'], env);
  } finally {
    rmSync(dir, { recursive: true });
  }
}

const dirOf = (issue) => path.resolve(git(['rev-parse', '--git-path', `break-it/${issue}`]));
const stateFile = (issue) => path.join(dirOf(issue), 'charters.json');

function issueOf(text) {
  if (!/^\d+$/.test(text ?? '')) throw new Stop(`"${text}" is not an issue number`);
  return text;
}

function load(issue) {
  const file = stateFile(issue);
  if (!existsSync(file)) throw new Stop(`issue ${issue} is not stamped: run head ${issue} first`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

const save = (issue, state) => writeFileSync(stateFile(issue), JSON.stringify(state, null, 2));

function loadOnThisCode(issue) {
  const state = load(issue);
  if (state.code !== codeNow()) {
    throw new Stop(`the code changed since it was stamped: run head ${issue} and drive it again`);
  }
  return state;
}

function head(issue) {
  mkdirSync(dirOf(issue), { recursive: true });
  const code = codeNow();
  const kept = existsSync(stateFile(issue)) && load(issue).code === code;
  if (!kept) save(issue, { code, charters: [] });
  console.log(dirOf(issue));
}

function charter(issue, text) {
  if (!FORM.test(text ?? '')) {
    throw new Stop(
      'a charter reads "explore <area> with <attack> to discover <risk>", on one line',
    );
  }
  const state = loadOnThisCode(issue);
  const key = `EX-${issue}.${state.charters.length + 1}`;
  state.charters.push({ key, text: text.trim() });
  save(issue, state);
  console.log(key);
}

function record(key, status, { screenshot, note }) {
  const issue = /^EX-(\d+)\.\d+$/.exec(key ?? '')?.[1];
  if (!issue) throw new Stop(`"${key}" is not a charter key such as EX-8.1`);
  if (!STATUSES.includes(status)) throw new Stop(`the status is one of ${STATUSES.join(', ')}`);
  if (!note?.trim())
    throw new Stop('a result needs a --note naming what was tried, values included');
  if (status !== 'blocked' && !(screenshot && existsSync(screenshot))) {
    throw new Stop(`a ${status} needs a --screenshot that exists`);
  }
  const state = loadOnThisCode(issue);
  const found = state.charters.find((each) => each.key === key);
  if (!found) throw new Stop(`there is no charter ${key}: register it first`);
  found.result = { status, note: note.trim(), screenshot: screenshot && path.resolve(screenshot) };
  save(issue, state);
}

function check(issue) {
  const { charters } = loadOnThisCode(issue);
  for (const { key, text, result } of charters) {
    console.log(`${key} ${result?.status ?? 'missing'}: ${text}`);
    if (result)
      console.log(`  ${result.note}${result.screenshot ? ` (${result.screenshot})` : ''}`);
  }
  const missing = charters.filter(({ result }) => !result).length;
  if (charters.length === 0) throw new Stop('INCOMPLETE: no charter was explored');
  if (missing > 0) throw new Stop(`INCOMPLETE: ${missing} of ${charters.length} have no result`);
  console.log(`${charters.length} explored, every one with a result`);
}

try {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { screenshot: { type: 'string' }, note: { type: 'string' } },
  });
  const [command, first, second] = positionals;
  if (command === 'head') head(issueOf(first));
  else if (command === 'charter') charter(issueOf(first), second);
  else if (command === 'record') record(first, second, values);
  else if (command === 'check') check(issueOf(first));
  else throw new Stop('usage: charters.mjs head | charter | record | check');
} catch (error) {
  console.error(error instanceof Stop ? error.message : error);
  process.exitCode = 1;
}
