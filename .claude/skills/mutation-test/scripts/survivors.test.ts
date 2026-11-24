import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPT = path.join(__dirname, 'survivors.mjs');

type Mutant = { status: string; line: number; mutatorName?: string; replacement?: string };

/** A Stryker JSON report in a fresh directory, one source file holding `mutants`. */
const report = (mutants: Mutant[]) => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'survivors-')), 'mutation.json');
  writeFileSync(
    file,
    JSON.stringify({
      files: {
        'src/a.ts': {
          source: 'const one = 1;\nif (watts > 0) show();\n',
          mutants: mutants.map(
            ({ status, line, mutatorName = 'Conditional', replacement = 'true' }, id) => ({
              id: String(id),
              status,
              mutatorName,
              replacement,
              location: { start: { line, column: 5 }, end: { line, column: 14 } },
            }),
          ),
        },
      },
    }),
  );
  return file;
};

const survivors = (file: string) => execFileSync('node', [SCRIPT, file], { encoding: 'utf8' });

describe('survivors.mjs', () => {
  it('lists every survivor and uncovered mutant with its place, mutator, replacement and source line', () => {
    // Given a report with a survivor, an uncovered mutant, and killed and timed-out ones
    const file = report([
      { status: 'Survived', line: 2, mutatorName: 'EqualityOperator', replacement: 'watts >= 0' },
      { status: 'NoCoverage', line: 1, mutatorName: 'NumericLiteral', replacement: '0' },
      { status: 'Killed', line: 2 },
      { status: 'Timeout', line: 2 },
    ]);

    // When the survivors are listed
    const output = survivors(file);

    // Then each one left alive is there in full, and nothing that was killed
    expect(output).toContain(
      'src/a.ts:2:5 Survived EqualityOperator → watts >= 0 | if (watts > 0) show();',
    );
    expect(output).toContain('src/a.ts:1:5 NoCoverage NumericLiteral → 0 | const one = 1;');
    expect(output.match(/^src\//gm)).toHaveLength(2);
  });

  it('ends with the count of each status, so the score never stands alone', () => {
    // Given a report with mutants in three statuses
    const file = report([
      { status: 'Killed', line: 1 },
      { status: 'Killed', line: 2 },
      { status: 'Survived', line: 2 },
      { status: 'Timeout', line: 1 },
    ]);

    // When the survivors are listed
    const output = survivors(file);

    // Then the last line counts them
    expect(output.trim().split('\n').at(-1)).toBe('Killed 2, Survived 1, Timeout 1');
  });

  it('fails on a report with no mutants, since nothing was proved', () => {
    // Given a scope Stryker found nothing to mutate in
    const file = report([]);

    // When the survivors are listed
    const { status, stdout } = spawnSync('node', [SCRIPT, file], { encoding: 'utf8' });

    // Then it is not a pass, and says what to do instead
    expect(status).toBe(1);
    expect(stdout).toContain('0 mutants');
    expect(stdout).toContain('by hand');
  });
});
