// The break-it tester's charters and their results, kept inside .git so that recording one never
// changes the code it is evidence for.
//
//   charters.mjs head <issue> [--base <commit>]
//                                           stamps the code; rows recorded on other code are dropped
//   charters.mjs charter <issue> <charter>  registers "explore … with … to discover …", prints its key
//   charters.mjs record <key> pass|fail|blocked [--snapshot <file>] [--screenshot <file>] --note <text>
//   charters.mjs check <issue>              exits 1 on no charter, or on one with no result
//   charters.mjs gate <issue> <gate> [--photos <dir>]
//                                           records a sign-off gate as run on the code as it stands;
//                                           verify's photographs must be newer than the last edit
//   charters.mjs gates <issue>              exits 1 unless every gate ran on the code as it stands
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';

const FORM = /^explore\s+\S.*\swith\s+\S.*\sto discover\s+\S.*$/i;
/** A small change takes few charters: its last ones were spent on what no user would meet. */
const SMALL = { lines: 100, charters: 4 };
const STATUSES = ['pass', 'fail', 'blocked'];

class Stop extends Error {}

const git = (args, env = process.env) =>
  execFileSync('git', args, { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/**
 * The tree of the working copy as it stands, untracked files included, without touching its index.
 * From an empty index, so every file is read: a copy of the real one carries its cached timestamps
 * under a newer timestamp of its own, and git then takes a same-size edit made within the second for
 * no edit at all.
 */
function codeNow() {
  const dir = mkdtempSync(path.join(tmpdir(), 'code-'));
  try {
    const env = { ...process.env, GIT_INDEX_FILE: path.join(dir, 'index') };
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

/**
 * The lines of the app the change adds and removes, its tests left out. An epic is explored on main,
 * where nothing differs from origin/main, so it names the commit it started from.
 */
function changedLines(base, code) {
  const counts = git([
    'diff',
    '--numstat',
    base,
    code,
    '--',
    ':/app',
    ':/src',
    ':(top,exclude,glob)**/*.test.*',
  ]);
  return counts
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => line.split('\t').slice(0, 2))
    .reduce((total, count) => total + (Number(count) || 0), 0);
}

/** Where the branch left main; unknown without an origin, which is then no reason to lift the limit. */
function branchPoint() {
  try {
    return git(['merge-base', 'HEAD', 'origin/main']);
  } catch {
    return git(['rev-parse', 'HEAD']);
  }
}

function head(issue, { base = branchPoint() }) {
  mkdirSync(dirOf(issue), { recursive: true });
  const code = codeNow();
  const kept = existsSync(stateFile(issue)) && load(issue).code === code;
  if (!kept) save(issue, { code, charters: [], lines: changedLines(base, code) });
  console.log(dirOf(issue));
}

function charter(issue, text) {
  if (!FORM.test(text ?? '')) {
    throw new Stop(
      'a charter reads "explore <area> with <attack> to discover <risk>", on one line',
    );
  }
  const state = loadOnThisCode(issue);
  if (state.lines <= SMALL.lines && state.charters.length >= SMALL.charters) {
    throw new Stop(
      `a change of ${state.lines} lines takes ${SMALL.charters} charters: drive the riskiest of what you have`,
    );
  }
  const key = `EX-${issue}.${state.charters.length + 1}`;
  state.charters.push({ key, text: text.trim() });
  save(issue, state);
  console.log(key);
}

/** The files a result rests on, each refused when it shows nothing: a failed `ad snapshot > file` leaves it empty. */
function evidence({ snapshot, screenshot }) {
  return [snapshot, screenshot].filter(Boolean).map((file) => {
    if (!existsSync(file)) throw new Stop(`the evidence ${file} does not exist`);
    if (statSync(file).size === 0) throw new Stop(`the evidence ${file} is empty`);
    return path.resolve(file);
  });
}

function record(key, status, { note, ...files }) {
  const issue = /^EX-(\d+)\.\d+$/.exec(key ?? '')?.[1];
  if (!issue) throw new Stop(`"${key}" is not a charter key such as EX-8.1`);
  if (!STATUSES.includes(status)) throw new Stop(`the status is one of ${STATUSES.join(', ')}`);
  if (!note?.trim())
    throw new Stop('a result needs a --note naming what was tried, values included');
  const shown = evidence(files);
  if (status !== 'blocked' && shown.length === 0) {
    throw new Stop(`a ${status} needs a --snapshot, or a --screenshot where the pixels decide`);
  }
  const state = loadOnThisCode(issue);
  const found = state.charters.find((each) => each.key === key);
  if (!found) throw new Stop(`there is no charter ${key}: register it first`);
  found.result = { status, note: note.trim(), evidence: shown };
  save(issue, state);
}

/** feature-sign-off's gates, in order. */
const GATES = ['simplify', 'mutation-test', 'code-review', 'check-adrs', 'verify'];
const gatesFile = (issue) => path.join(dirOf(issue), 'gates.json');
const loadGates = (issue) =>
  existsSync(gatesFile(issue)) ? JSON.parse(readFileSync(gatesFile(issue), 'utf8')) : {};

/** When the change was last edited: the newest of the files it touches, untracked ones included. */
function lastEdit() {
  const files = [
    ...git(['diff', '--name-only', branchPoint()]).split('\n'),
    ...git(['ls-files', '--others', '--exclude-standard']).split('\n'),
  ].filter(Boolean);
  const top = git(['rev-parse', '--show-toplevel']);
  return Math.max(
    0,
    ...files
      .map((file) => path.join(top, file))
      .filter(existsSync)
      .map((file) => statSync(file).mtimeMs),
  );
}

/** Photographs taken before the last edit are of other code. */
function stalePhotos(dir) {
  const edited = lastEdit();
  return readdirSync(dir)
    .filter((name) => name.endsWith('.png'))
    .filter((name) => statSync(path.join(dir, name)).mtimeMs < edited);
}

function gate(issue, name, { photos }) {
  if (!GATES.includes(name)) throw new Stop(`a gate is one of ${GATES.join(', ')}`);
  if (photos) {
    const stale = stalePhotos(photos);
    if (stale.length > 0) {
      throw new Stop(`older than the code they are of, so take them again: ${stale.join(', ')}`);
    }
  }
  mkdirSync(dirOf(issue), { recursive: true });
  const gates = loadGates(issue);
  gates[name] = codeNow();
  writeFileSync(gatesFile(issue), JSON.stringify(gates, null, 2));
}

/** Every gate on the code as it stands: a fix made after one sends it round again. */
function checkGates(issue) {
  const gates = loadGates(issue);
  const code = codeNow();
  const states = GATES.map((name) => [
    name,
    !gates[name] ? 'missing' : gates[name] === code ? 'ok' : 'stale',
  ]);
  for (const [name, state] of states) console.log(`${name} ${state}`);
  const owed = states.filter(([, state]) => state !== 'ok').length;
  if (owed > 0) throw new Stop(`INCOMPLETE: ${owed} of ${GATES.length} gates to run on this code`);
  console.log(`${GATES.length} gates, every one on this code`);
}

function check(issue) {
  const { charters } = loadOnThisCode(issue);
  for (const { key, text, result } of charters) {
    console.log(`${key} ${result?.status ?? 'missing'}: ${text}`);
    if (result) console.log(`  ${[result.note, ...result.evidence].join('\n  ')}`);
  }
  const missing = charters.filter(({ result }) => !result).length;
  if (charters.length === 0) throw new Stop('INCOMPLETE: no charter was explored');
  if (missing > 0) throw new Stop(`INCOMPLETE: ${missing} of ${charters.length} have no result`);
  console.log(`${charters.length} explored, every one with a result`);
}

try {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      snapshot: { type: 'string' },
      screenshot: { type: 'string' },
      note: { type: 'string' },
      base: { type: 'string' },
      photos: { type: 'string' },
    },
  });
  const [command, first, second] = positionals;
  if (command === 'head') head(issueOf(first), values);
  else if (command === 'charter') charter(issueOf(first), second);
  else if (command === 'record') record(first, second, values);
  else if (command === 'check') check(issueOf(first));
  else if (command === 'gate') gate(issueOf(first), second, values);
  else if (command === 'gates') checkGates(issueOf(first));
  else throw new Stop('usage: charters.mjs head | charter | record | check | gate | gates');
} catch (error) {
  console.error(error instanceof Stop ? error.message : error);
  process.exitCode = 1;
}
