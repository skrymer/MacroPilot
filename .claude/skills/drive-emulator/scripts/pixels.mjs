#!/usr/bin/env node
// The colour of the screen at points named by whoever asks, as evidence a command printed:
//
//   pixels.mjs ground=540,1200 bar=60,2320
//
// Measures nothing while the development build's warning toast or log box is in front, since its white
// has been taken for the tab bar's. Run emulator.sh first.
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const OVERLAY = /"!, |"Minimize"/;

const points = process.argv.slice(2).map((arg) => {
  const [, name, x, y] = /^([\w-]+)=(\d+),(\d+)$/.exec(arg) ?? [];
  if (!name) {
    console.error('usage: pixels.mjs <name>=<x>,<y>…');
    process.exit(2);
  }
  return { name, x: Number(x), y: Number(y) };
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
for (const { name, x, y } of points) {
  if (x >= width || y >= height) {
    console.error(`${name} ${x},${y} is off the ${width}x${height} screen`);
    process.exit(1);
  }
  const at = 16 + (y * width + x) * 4;
  console.log(`${name} ${x},${y} #${raw.subarray(at, at + 3).toString('hex')}`);
}
