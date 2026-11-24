import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SIZES = path.join(__dirname, 'sizes.sh');
const EMULATOR = path.join(__dirname, 'emulator.sh');
const PIXELS = path.join(__dirname, 'pixels.mjs');

/** An Android SDK and a PATH of stand-ins, each logging how it was called and then running `body`. */
const stage = (tools: Record<string, string>) => {
  const root = mkdtempSync(path.join(tmpdir(), 'emulator-'));
  const log = path.join(root, 'calls.log');
  const bins = ['bin', 'platform-tools', 'emulator'].map((dir) => path.join(root, dir));
  for (const dir of bins) mkdirSync(dir);
  for (const [name, body] of Object.entries(tools)) {
    const file = path.join(
      name === 'emulator' ? bins[2]! : name === 'adb' ? bins[1]! : bins[0]!,
      name,
    );
    writeFileSync(file, `#!/usr/bin/env bash\necho "${name} $*" >>"${log}"\n${body}\n`);
    chmodSync(file, 0o755);
  }
  const run = (script: string, args: string[], env: Record<string, string> = {}) => {
    const { status, stdout, stderr } = spawnSync(script, args, {
      env: { ...process.env, ANDROID_HOME: root, PATH: `${bins[0]}:${process.env.PATH}`, ...env },
      encoding: 'utf8',
    });
    const calls = existsSync(log) ? readFileSync(log, 'utf8') : '';
    return { status, output: stdout + stderr, calls };
  };
  return { root, run };
};

/** A device 1080 wide whose screenshots are all alike, so each screen is one page. */
const DEVICE = {
  adb: '[[ "$*" == "shell wm size" ]] && echo "Physical size: 1080x2400"; exit 0',
  npx: '[ "$2" = screenshot ] && echo png >"$3"; exit 0',
};

const OUT = () => mkdtempSync(path.join(tmpdir(), 'shots-'));

describe('sizes.sh', () => {
  it('photographs all five sizes when none is named', () => {
    // Given a device

    // When a screen is photographed
    const { status, output } = stage(DEVICE).run(SIZES, [OUT(), 'design']);

    // Then there is a photo at each size
    expect(status).toBe(0);
    expect(output.match(/design-[a-z-]+(?=-1\.png)/g)?.sort()).toEqual([
      'design-default',
      'design-display',
      'design-text',
      'design-worst',
      'design-worst-dark',
    ]);
  });

  it('photographs only the sizes named, and says the rest are owed', () => {
    // Given a device

    // When one size is asked for
    const { output } = stage(DEVICE).run(SIZES, [OUT(), 'design'], { SIZES: 'worst' });

    // Then only it is there, and the run says it is not the whole check
    expect(output.match(/design-[a-z-]+(?=-1\.png)/g)).toEqual(['design-worst']);
    expect(output).toContain('not the whole check');
  });

  it('refuses a size there is not, before touching the device', () => {
    // Given a device

    // When a size that does not exist is asked for
    const { status, calls } = stage(DEVICE).run(SIZES, [OUT(), 'design'], { SIZES: 'huge' });

    // Then it stops, with nothing changed
    expect(status).toBe(2);
    expect(calls).not.toContain('font_scale');
  });

  it('puts the device back when a screen could not be opened', () => {
    // Given a device whose app never loads
    const tools = { ...DEVICE, npx: '[ "$2" = wait ] && exit 1; exit 0' };

    // When a screen is photographed
    const { status, calls } = stage(tools).run(SIZES, [OUT(), 'design'], { SIZES: 'worst' });

    // Then it fails, with the text and display sizes put back last
    expect(status).toBe(1);
    expect(calls.lastIndexOf('font_scale 1.0')).toBeGreaterThan(
      calls.lastIndexOf('font_scale 2.0'),
    );
    expect(calls.lastIndexOf('density reset')).toBeGreaterThan(calls.lastIndexOf('density 540'));
  });
});

describe('emulator.sh', () => {
  let neighbour: ChildProcess | undefined;
  afterEach(() => neighbour?.kill());

  const PLENTY = () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'mem-')), 'meminfo');
    writeFileSync(file, 'MemTotal: 32000000 kB\nMemAvailable: 20000000 kB\n');
    return file;
  };

  it('does not boot beside another checkout’s mutation run, and names it', () => {
    // Given Stryker running from another checkout
    const elsewhere = mkdtempSync(path.join(tmpdir(), 'other-'));
    neighbour = spawn('sleep', ['60'], { cwd: elsewhere });
    const { run } = stage({ adb: '', emulator: 'echo avd', pgrep: `echo ${neighbour.pid}` });

    // When the emulator is asked for
    const { status, output, calls } = run(EMULATOR, [], { MEMINFO: PLENTY() });

    // Then nothing is booted, and the user can be asked about that checkout
    expect(status).toBe(1);
    expect(output).toContain(elsewhere);
    expect(calls).not.toContain('emulator -avd');
  });

  it('does not boot when memory is short', () => {
    // Given three gigabytes to spare
    const meminfo = PLENTY();
    writeFileSync(meminfo, 'MemAvailable: 3000000 kB\n');
    const { run } = stage({ adb: '', emulator: 'echo avd', pgrep: 'exit 1' });

    // When the emulator is asked for
    const { status, output, calls } = run(EMULATOR, [], { MEMINFO: meminfo });

    // Then nothing is booted
    expect(status).toBe(1);
    expect(output).toContain('memory');
    expect(calls).not.toContain('emulator -avd');
  });
});

describe('pixels.mjs', () => {
  /** A 2×2 screen: red and green above, blue and white below, as `screencap` writes it raw. */
  const SCREEN = [
    '\\x02\\x00\\x00\\x00\\x02\\x00\\x00\\x00\\x01\\x00\\x00\\x00\\x01\\x00\\x00\\x00',
    '\\xff\\x00\\x00\\xff\\x00\\xff\\x00\\xff\\x00\\x00\\xff\\xff\\xff\\xff\\xff\\xff',
  ].join('');

  const device = (tree: string) => ({
    adb: `[ "$2" = screencap ] && printf '${SCREEN}'; exit 0`,
    npx: `echo '${tree}'; exit 0`,
  });

  it('prints the colour at each point named', () => {
    // Given a screen with nothing over the app

    // When two points are measured
    const { status, output } = stage(device('@e1 [group] "Today"')).run(PIXELS, [
      'ground=0,0',
      'bar=1,1',
    ]);

    // Then each is named with its colour
    expect(status).toBe(0);
    expect(output).toContain('ground 0,0 #ff0000');
    expect(output).toContain('bar 1,1 #ffffff');
  });

  it.each([
    ['a warning toast', '@e6 [group] "!, ImageBackground is deprecated"'],
    ['the log box', '@e33 [group] "Minimize"'],
  ])('measures nothing through %s', (_, tree) => {
    // Given the development build's overlay in front of the app

    // When a point is measured
    const { status, output } = stage(device(tree)).run(PIXELS, ['bar=1,1']);

    // Then it is refused, and no colour is printed
    expect(status).toBe(1);
    expect(output).toContain('overlay');
    expect(output).not.toContain('#');
  });

  it('refuses a point off the screen', () => {
    // Given a screen two pixels wide

    // When a point beyond it is measured
    const { status, output } = stage(device('@e1 [group] "Today"')).run(PIXELS, ['bar=2,0']);

    // Then it is refused, with the screen's size
    expect(status).toBe(1);
    expect(output).toContain('2x2');
  });
});
