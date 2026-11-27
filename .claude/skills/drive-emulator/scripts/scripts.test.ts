import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
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

import tailwind from '../../../../tailwind.config.js';

const SIZES = path.join(__dirname, 'sizes.sh');
const EMULATOR = path.join(__dirname, 'emulator.sh');
const PIXELS = path.join(__dirname, 'pixels.mjs');
const SPACING = path.join(__dirname, 'spacing.mjs');

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
  it('photographs both sizes, and no narrower screen, when none is named', () => {
    // Given a device

    // When a screen is photographed
    const { status, output } = stage(DEVICE).run(SIZES, [OUT(), 'design']);

    // Then there is a photo at each size
    expect(status).toBe(0);
    expect(output.match(/design-[a-z-]+(?=-1\.png)/g)?.sort()).toEqual([
      'design-default',
      'design-text',
    ]);
  });

  it('photographs only the sizes named, and says the rest are owed', () => {
    // Given a device

    // When one size is asked for
    const { output } = stage(DEVICE).run(SIZES, [OUT(), 'design'], { SIZES: 'text' });

    // Then only it is there, and the run says it is not the whole check
    expect(output.match(/design-[a-z-]+(?=-1\.png)/g)).toEqual(['design-text']);
    expect(output).toContain('not the whole check');
  });

  it('photographs in the appearance named, and puts light back after', () => {
    // Given a device

    // When a screen is photographed in dark
    const { output, calls } = stage(DEVICE).run(SIZES, [OUT(), 'design'], {
      SIZES: 'default',
      APPEARANCE: 'dark',
    });

    // Then the photos are dark, named so, and light is put back last
    expect(output.match(/design-[a-z-]+(?=-1\.png)/g)).toEqual(['design-default-dark']);
    expect(calls.indexOf('uimode night yes')).toBeGreaterThan(-1);
    expect(calls.indexOf('uimode night yes')).toBeLessThan(calls.indexOf('screenshot'));
    expect(calls.lastIndexOf('uimode night no')).toBeGreaterThan(calls.lastIndexOf('screenshot'));
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
    const { status, calls } = stage(tools).run(SIZES, [OUT(), 'design'], { SIZES: 'text' });

    // Then it fails, with the text size put back last, and the display's own size
    expect(status).toBe(1);
    expect(calls.lastIndexOf('font_scale 1.0')).toBeGreaterThan(
      calls.lastIndexOf('font_scale 2.0'),
    );
    expect(calls).toContain('density reset');
    expect(calls).not.toMatch(/density \d/);
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

describe('spacing.mjs', () => {
  /**
   * A screen at 320dpi, two pixels to the dp: a title 32px from the edge, a figure 32px below it and
   * a unit 16px to its right, and a row 144px tall.
   */
  const NODES = [
    { label: 'Today', rect: { x: 32, y: 100, width: 200, height: 60 } },
    { label: '1,250 kcal today', rect: { x: 32, y: 192, width: 300, height: 80 } },
    { label: 'kcal', rect: { x: 348, y: 192, width: 80, height: 80 } },
    { label: 'Oats, 50 g', rect: { x: 0, y: 400, width: 1080, height: 144 } },
    { label: 'Hidden', rect: { x: 0, y: 0, width: 0, height: 0 } },
  ];

  const device = (nodes: object[] = NODES) => ({
    adb: '[ "$2" = wm ] && echo "Physical density: 320"; exit 0',
    npx: `echo '${JSON.stringify({ data: { nodes } })}'; exit 0`,
  });

  it('passes each gap that is its token, and says which token', () => {
    // Given a screen whose gaps are on the grid

    // When a margin, a vertical gap and a horizontal gap are measured
    const { status, output } = stage(device()).run(SPACING, [
      '..Today=page',
      'Today..*today=grid-2',
      '1,250..kcal=grid-1',
    ]);

    // Then each passes, in dp against the dp its token requires
    expect(status).toBe(0);
    expect(output).toContain("PASS margin → 'Today': 16dp, required 16dp (page)");
    expect(output).toContain("PASS vertical gap 'Today' → '*today': 16dp, required 16dp (grid-2)");
    expect(output).toContain("PASS horizontal gap '1,250' → 'kcal': 8dp, required 8dp (grid-1)");
  });

  it('adds tokens joined by a plus', () => {
    // Given a title 16dp from the screen's edge

    // When the title is measured against the page's margin and a step of the grid
    const { status, output } = stage(device()).run(SPACING, ['..Today=page+grid-1']);

    // Then the required value is their sum
    expect(status).toBe(1);
    expect(output).toContain("FAULT margin → 'Today': 16dp, required 24dp (page+grid-1)");
  });

  it('prints a fault against the required value, and fails', () => {
    // Given a title 16dp below the screen's edge

    // When it is measured against the third step of the grid
    const { status, output } = stage(device()).run(SPACING, ['..Today=grid-3']);

    // Then the fault names what it is and what it must be
    expect(status).toBe(1);
    expect(output).toContain("FAULT margin → 'Today': 16dp, required 24dp (grid-3)");
  });

  it('holds a height to its token as a floor', () => {
    // Given a row 72dp tall and a title 30dp tall

    // When both are measured as two-line rows
    const { status, output } = stage(device()).run(SPACING, ['Oats=two-line', 'Today=two-line']);

    // Then the row passes and the title is a fault
    expect(status).toBe(1);
    expect(output).toContain("PASS height 'Oats': 72dp, required at least 72dp (two-line)");
    expect(output).toContain("FAULT height 'Today': 30dp, required at least 72dp (two-line)");
  });

  it('refuses a token there is not, before touching the device', () => {
    // Given a device

    // When a gap is measured against an unknown token
    const { status, output, calls } = stage(device()).run(SPACING, ['Today..kcal=grid-9']);

    // Then it stops, naming it
    expect(status).toBe(2);
    expect(output).toContain('grid-9');
    expect(calls).not.toContain('snapshot');
  });

  it('refuses an element not on the screen, rather than measure another', () => {
    // Given a screen with a hidden element

    // When the hidden one is measured
    const { status, output } = stage(device()).run(SPACING, ['..Hidden=page']);

    // Then nothing is measured, and it says what is missing
    expect(status).toBe(2);
    expect(output).toContain("no 'Hidden' on the screen");
    expect(output).not.toContain('PASS');
  });

  it('measures nothing through the development build’s overlay', () => {
    // Given the log box in front of the app
    const nodes = [...NODES, { label: 'Minimize', rect: { x: 0, y: 0, width: 9, height: 9 } }];

    // When a gap is measured
    const { status, output } = stage(device(nodes)).run(SPACING, ['..Today=page']);

    // Then it is refused
    expect(status).toBe(1);
    expect(output).toContain('overlay');
    expect(output).not.toContain('dp');
  });

  it('reads the spacing tokens as tailwind.config.js has them', () => {
    // Given the theme's spacing
    const spacing = tailwind.theme?.extend?.spacing as Record<string, string>;

    // When the script prints its table
    const { output } = stage(device()).run(SPACING, ['--tokens']);

    // Then every spacing token is in it at the same size
    for (const [name, px] of Object.entries(spacing)) {
      expect(output).toContain(`${name} ${parseInt(px)}dp`);
    }
  });
});

describe('mutant-proxy.mjs', () => {
  const MUTANT = path.join(__dirname, 'mutant-proxy.mjs');
  let metro: http.Server;
  let proxy: ChildProcess | undefined;

  afterEach(() => {
    proxy?.kill();
    metro?.close();
  });

  /** A Metro on a free port serving a manifest that names itself, and a bundle holding `source`. */
  const serve = (source: string) =>
    new Promise<number>((resolve) => {
      metro = http.createServer((req, res) => {
        const port = (metro.address() as AddressInfo).port;
        if (req.url!.includes('.bundle')) {
          res.writeHead(200, { 'content-type': 'application/javascript' });
          res.end(source);
        } else {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ bundleUrl: `http://127.0.0.1:${port}/index.bundle` }));
        }
      });
      metro.listen(0, () => resolve((metro.address() as AddressInfo).port));
    });

  /** The proxy in front of `up`, once it says it is listening. */
  const start = (up: number, port: number, from: string, to: string) =>
    new Promise<void>((resolve, reject) => {
      proxy = spawn('node', [MUTANT, from, to], {
        env: { ...process.env, METRO_PORT: String(up), PROXY_PORT: String(port) },
      });
      let output = '';
      proxy.stderr!.on('data', (chunk: Buffer) => (output += chunk.toString()));
      proxy.on('exit', (code) => reject(new Error(`proxy exited ${code}: ${output}`)));
      proxy.stdout!.on('data', (chunk: Buffer) => {
        if (chunk.toString().includes('mutant proxy on')) resolve();
      });
    });

  const PROXY_PORT = 18083;

  it('serves the bundle with the one source string replaced', async () => {
    // Given a Metro whose bundle reads the grams, and a proxy replacing them
    const up = await serve('const grams = entry.grams;');
    await start(up, PROXY_PORT, 'entry.grams', '100');

    // When the bundle is fetched through the proxy
    const body = await (await fetch(`http://127.0.0.1:${PROXY_PORT}/index.bundle`)).text();

    // Then it holds the mutant
    expect(body).toBe('const grams = 100;');
  });

  it("points the manifest's bundle at itself, so the app loads the mutant", async () => {
    // Given a Metro and a proxy in front of it
    const up = await serve('');
    await start(up, PROXY_PORT, 'a', 'b');

    // When the manifest is fetched through the proxy
    const body = await (await fetch(`http://127.0.0.1:${PROXY_PORT}/`)).text();

    // Then its bundle is the proxy's
    expect(JSON.parse(body).bundleUrl).toBe(`http://127.0.0.1:${PROXY_PORT}/index.bundle`);
  });
});
