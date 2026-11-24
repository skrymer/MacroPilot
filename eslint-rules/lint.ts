import { Linter } from 'eslint';
import path from 'node:path';

// The project's own flat config, not a rule in isolation, so a test also proves
// the wiring: which files a rule reaches, and which directories are exempt.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('../eslint.config.js');

const root = path.resolve(__dirname, '..');

const linter = new Linter({ configType: 'flat', cwd: root });

/** The rule ids ESLint reports for `code`, as though it were saved at `filePath`. */
export const lint = (code: string, filePath: string): (string | null)[] =>
  linter
    .verify(code, config, { filename: path.join(root, filePath) })
    .map((message) => message.ruleId);
