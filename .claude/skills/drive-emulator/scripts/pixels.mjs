#!/usr/bin/env node
// The colour of the screen at points named by whoever asks, as evidence a command printed:
//
//   pixels.mjs ground=540,1200 bar=60,2320
//   pixels.mjs gap=522,1293:line arc=600,1300:within figure=500,640:over@dark
//
// A point given a DESIGN.md token is held to it, light or `@dark`, and printed PASS or FAULT with the
// colour it had to be; a fault exits 1. That is the measurement probity reads as a fault (rn-dev): a
// bare colour says nothing of what it should have been.
//
// Measures nothing while the development build's warning toast or log box is in front, since its white
// has been taken for the tab bar's. Run emulator.sh first.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const OVERLAY = /"!, |"Minimize"/;
const TOKENS = createRequire(import.meta.url)('../../../../design-tokens.js');

const points = process.argv.slice(2).map((arg) => {
  const [, name, x, y, token, dark] =
    /^([\w-]+)=(\d+),(\d+)(?::([\w-]+)(@dark)?)?$/.exec(arg) ?? [];
  if (!name) {
    console.error('usage: pixels.mjs <name>=<x>,<y>[:<token>[@dark]]…');
    process.exit(2);
  }
  const appearance = dark ? 'dark' : 'light';
  if (token && !(token in TOKENS[appearance])) {
    console.error(`no token ${token}: ${Object.keys(TOKENS[appearance])}`);
    process.exit(2);
  }
  const required = token && TOKENS[appearance][token].toLowerCase();
  return { name, x: Number(x), y: Number(y), token, dark, required };
});

const tree = execFileSync(
  'npx',
  ['agent-device', 'snapshot', '--force-full', '--platform', 'android'],
  {
    encoding: 'utf8',
  },
);
if (OVERLAY.test(tree)) {
  console.error('a warning overlay is in front of the app: dismiss it, or load the bundle again');
  process.exit(1);
}

const adb = path.join(
  process.env.ANDROID_HOME ?? path.join(process.env.HOME, 'Android/Sdk'),
  'platform-tools/adb',
);
// Raw: width, height, format and colour space, four bytes each, then RGBA.
const raw = execFileSync(adb, ['exec-out', 'screencap'], { maxBuffer: 64 * 1024 * 1024 });
const [width, height] = [raw.readUInt32LE(0), raw.readUInt32LE(4)];
let faults = 0;
for (const { name, x, y, token, dark, required } of points) {
  if (x >= width || y >= height) {
    console.error(`${name} ${x},${y} is off the ${width}x${height} screen`);
    process.exit(1);
  }
  const at = 16 + (y * width + x) * 4;
  const colour = `#${raw.subarray(at, at + 3).toString('hex')}`;
  const which = `(${token}${dark ? ', dark' : ''})`;
  if (!token) console.log(`${name} ${x},${y} ${colour}`);
  else if (colour === required) console.log(`${name} ${x},${y} ${colour} PASS ${which}`);
  else {
    faults += 1;
    console.log(`${name} ${x},${y} ${colour} FAULT required ${required} ${which}`);
  }
}
process.exit(faults > 0 ? 1 : 0);
