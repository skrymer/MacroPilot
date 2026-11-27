// PreToolUse on Write and Edit, run by test-guard.sh: a committed test is the user's (CLAUDE.md), so a
// write that would change or remove one is refused. A test not yet committed stays the agent's to
// change, and adding a test beside the committed ones is always let through.
//
// Tests are found by the TypeScript parser, not by pattern: each `it`/`test` call (with `.each`,
// `.only`, `.skip`), named by its describes and its own name, compared by its whole text.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

const call = JSON.parse(readFileSync(0, 'utf8') || '{}');
const input = call.tool_input ?? {};
const file = input.file_path;
if (typeof file !== 'string' || !/\.test\.tsx?$/.test(file)) process.exit(0);

const git = (cwd, ...args) => {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return undefined;
  }
};

const folder = path.dirname(file);
if (!existsSync(folder)) process.exit(0);
const top = git(folder, 'rev-parse', '--show-toplevel')?.trim();
if (!top) process.exit(0);
const committed = git(top, 'show', `HEAD:${path.relative(top, file)}`);
if (committed === undefined) process.exit(0);

/** The file as the write would leave it, or undefined when the write cannot apply. */
const after = () => {
  if (call.tool_name === 'Write') return input.content;
  if (call.tool_name !== 'Edit' || !existsSync(file)) return undefined;
  const now = readFileSync(file, 'utf8');
  const { old_string: from, new_string: to, replace_all: all } = input;
  if (typeof from !== 'string' || typeof to !== 'string' || !now.includes(from)) return undefined;
  return all ? now.split(from).join(to) : now.replace(from, () => to);
};
const written = after();
if (typeof written !== 'string') process.exit(0);

const TEST = new Set(['it', 'test']);
const DESCRIBE = new Set(['describe']);

/** The base name of a call's callee: `it` for `it(…)`, `it.each(…)(…)`, `it.only(…)`. */
const calleeName = (expression) => {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return calleeName(expression.expression);
  if (ts.isCallExpression(expression)) return calleeName(expression.expression);
  if (ts.isTaggedTemplateExpression(expression)) return calleeName(expression.tag);
  return undefined;
};

const titleOf = (node) => {
  const [first] = node.arguments;
  return first && (ts.isStringLiteralLike(first) || ts.isTemplateLiteral(first))
    ? first.getText().slice(1, -1)
    : (first?.getText() ?? '');
};

/** Each test in `source`: its describes and name joined by ›, to the texts of the tests so named. */
const testsIn = (source, name) => {
  const tree = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found = new Map();
  const visit = (node, describes) => {
    if (ts.isCallExpression(node)) {
      const callee = calleeName(node.expression);
      if (TEST.has(callee)) {
        const key = [...describes, titleOf(node)].join(' › ');
        found.set(key, [...(found.get(key) ?? []), node.getText()]);
        return;
      }
      if (DESCRIBE.has(callee)) {
        node.arguments.slice(1).forEach((child) => visit(child, [...describes, titleOf(node)]));
        return;
      }
    }
    ts.forEachChild(node, (child) => visit(child, describes));
  };
  visit(tree, []);
  return found;
};

const before = testsIn(committed, file);
const now = testsIn(written, file);
const changed = [...before].flatMap(([key, texts]) => {
  const kept = [...(now.get(key) ?? [])];
  return texts.some((text) => {
    const at = kept.indexOf(text);
    if (at === -1) return true;
    kept.splice(at, 1);
    return false;
  })
    ? [key]
    : [];
});

if (changed.length > 0) {
  process.stderr.write(
    [
      `This write would change or remove ${changed.length === 1 ? 'a committed test' : 'committed tests'}:`,
      ...changed.map((key) => `  - ${key}`),
      "A committed test is the user's to change (CLAUDE.md). Add a test with Edit, beside the others",
      'and leaving them as they are; to change a committed one, ask the user first.',
      '',
    ].join('\n'),
  );
  process.exit(2);
}
