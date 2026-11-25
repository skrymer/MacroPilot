const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

/**
 * One temporary directory for a run, inherited by its workers and by what they start, and removed with
 * it. The scripts' and the hooks' tests make thousands of files in it and remove none: left in the
 * machine's own they used up its inodes, and no command could run.
 */
module.exports = () => {
  const machines = process.env.TMPDIR;
  const own = mkdtempSync(path.join(tmpdir(), 'jest-run-'));
  process.env.TMPDIR = own;
  globalThis.removeOwnTmpdir = () => {
    if (machines === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = machines;
    rmSync(own, { recursive: true, force: true });
  };
};
