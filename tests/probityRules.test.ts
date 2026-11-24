import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CONFIG = pathToFileURL(path.join(__dirname, '../probity.config.ts')).href;

/**
 * The prompt the validator is handed for a write, from the config's own rule with a stand-in for the
 * model. Node loads the config, as Jest will not.
 */
const prompt = () =>
  execFileSync(
    'node',
    [
      '--no-warnings',
      '--input-type=module',
      '-e',
      `import config from '${CONFIG}';
       const agent = { reason: async (text) => { console.log(text); return { kind: 'pass' }; } };
       const write = { kind: 'write', path: 'src/a.ts', content: 'export const a = 1;' };
       await config.rules[0].rules[0](write, { agent });`,
    ],
    { encoding: 'utf8' },
  );

describe("probity's rules", () => {
  it('let a test be added before it has failed, and are otherwise the defaults', () => {
    // Given the config's rule

    // When it judges a write
    const told = prompt();

    // Then the validator has the defaults, reworded so that a red step is not refused for being red
    expect(told).toContain('## TDD rules');
    expect(told).not.toContain('A test added to drive new behavior must be observed failing');
    expect(told).toContain('never the write that adds the test');
  });

  it("let a change only the pixels can show be driven by its fault in a command's output", () => {
    // Given the config's rule

    // When it judges a write
    const told = prompt();

    // Then the exception is there, with what it outranks, its evidence and its limits
    expect(told).toContain('### A change only the pixels can show');
    expect(told).toContain('takes precedence over the red and green rules');
    expect(told).toContain("a pixel measurement in a command's output");
    expect(told).not.toContain('description of a screenshot');
    expect(told).toContain('a value, a word, a role, a label, navigation, state or a computation');
    expect(told).toContain('a size, a touch target, what is shown or what can be pressed');
  });
});
