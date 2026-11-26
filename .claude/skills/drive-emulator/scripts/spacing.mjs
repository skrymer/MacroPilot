#!/usr/bin/env node
// Each gap and height named by whoever asks, against the DESIGN.md token it must be, as evidence a
// command printed:
//
//   spacing.mjs ..Today=page  'Today..*today=grid-2'  'Oats=two-line'  ..Oats=page+grid-1
//
// `..B` is B's margin from the screen's left edge; `A..B` the gap from A to B, vertical when B is
// below A and horizontal when it is to the right; a bare `A` is A's height, held to the token as a
// floor. An element is the first on the screen whose label starts with the text, or ends with it
// after a `*`. Tokens joined by `+` are added. Exits 1 on any FAULT, 2 on a request it cannot measure.
// Measures nothing while the development build's warning toast or log box is in front. Run
// emulator.sh first; `--tokens` prints the table.
import { execFileSync } from 'node:child_process';
import path from 'node:path';

/** The tokens in dp as Android has them, from tailwind.config.js, which node cannot resolve per platform. */
const TOKENS = {
  page: 16,
  'grid-1': 8,
  'grid-2': 16,
  'grid-3': 24,
  target: 48,
  'two-line': 72,
};
/** A rect is whole pixels, so a dp is read to within this. */
const SLACK = 0.6;
const OVERLAY = (label) => label.startsWith('!, ') || label === 'Minimize';

const fail = (message, status = 2) => {
  console.error(message);
  process.exit(status);
};

if (process.argv[2] === '--tokens') {
  for (const [name, dp] of Object.entries(TOKENS)) console.log(`${name} ${dp}dp`);
  process.exit(0);
}

const requests = process.argv.slice(2).map((arg) => {
  const [, from, to, tokens] = /^(?:(.*?)\.\.)?(.+)=([\w+-]+)$/.exec(arg) ?? [];
  if (!to) fail('usage: spacing.mjs [<a>]..<b>=<token>[+<token>]… | <a>=<token>…');
  const names = tokens.split('+');
  for (const name of names) if (!(name in TOKENS)) fail(`no token ${name}: ${Object.keys(TOKENS)}`);
  return { from, to, tokens, required: names.reduce((sum, name) => sum + TOKENS[name], 0) };
});
if (requests.length === 0) fail('usage: spacing.mjs [<a>]..<b>=<token>[+<token>]… | <a>=<token>…');

const tree = JSON.parse(
  execFileSync('npx', ['agent-device', 'snapshot', '--raw', '--json', '--platform', 'android'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }),
);
const shown = tree.data.nodes.filter((node) => node.label && node.rect?.height > 0);
if (shown.some((node) => OVERLAY(node.label))) {
  fail('a warning overlay is in front of the app: dismiss it, or load the bundle again', 1);
}

const adb = path.join(
  process.env.ANDROID_HOME ?? path.join(process.env.HOME, 'Android/Sdk'),
  'platform-tools/adb',
);
const density = Number(
  /(\d+)\s*$/.exec(execFileSync(adb, ['shell', 'wm', 'density'], { encoding: 'utf8' }))?.[1],
);
if (!density) fail('the device did not say its density');
const dp = (px) => Math.round((px * 160 * 10) / density) / 10;

const find = (text) => {
  const matches = text.startsWith('*')
    ? (label) => label.endsWith(text.slice(1))
    : (label) => label.startsWith(text);
  return shown.find((node) => matches(node.label))?.rect ?? fail(`no '${text}' on the screen`);
};

// Every element is found before anything is printed, so a missing one measures nothing.
const measured = requests.map(({ from, to, tokens, required }) => {
  const b = find(to);
  if (from === undefined) {
    return { what: `height '${to}'`, got: dp(b.height), floor: true, tokens, required };
  }
  if (from === '') return { what: `margin → '${to}'`, got: dp(b.x), tokens, required };
  const a = find(from);
  const right = b.x >= a.x + a.width;
  return {
    what: `${right ? 'horizontal' : 'vertical'} gap '${from}' → '${to}'`,
    got: dp(right ? b.x - a.x - a.width : b.y - a.y - a.height),
    tokens,
    required,
  };
});

let faults = 0;
for (const { what, got, floor, tokens, required } of measured) {
  const ok = floor ? got >= required - SLACK : Math.abs(got - required) < SLACK;
  if (!ok) faults += 1;
  const verdict = ok ? 'PASS' : 'FAULT';
  console.log(
    `${verdict} ${what}: ${got}dp, required ${floor ? 'at least ' : ''}${required}dp (${tokens})`,
  );
}
process.exit(faults ? 1 : 0);
