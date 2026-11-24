/**
 * Requires every test body to be laid out `// Given`, `// When`, `// Then`, in
 * that order, each section marked by a comment.
 *
 * The rule checks the shape and cannot check the thinking: `// Given` above
 * nothing still passes. What it buys is that leaving the arrangement out becomes
 * deliberate rather than accidental, and that a `when` block growing a second
 * action is visible as one.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
const SECTIONS = ['Given', 'When', 'Then'];

const TEST_CALLERS = new Set(['it', 'test']);

/** `it(...)`, `test(...)`, `it.only(...)`, `it.each(...)(...)` and friends. */
const testCallName = (node) => {
  let callee = node.callee;
  while (callee.type === 'CallExpression') callee = callee.callee;
  while (callee.type === 'MemberExpression') callee = callee.object;
  return callee.type === 'Identifier' ? callee.name : null;
};

const bodyOf = (node) => {
  const last = node.arguments[node.arguments.length - 1];
  if (!last) return null;
  const isFunction = last.type === 'ArrowFunctionExpression' || last.type === 'FunctionExpression';
  return isFunction && last.body.type === 'BlockStatement' ? last.body : null;
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require given / when / then section comments in every test body',
    },
    schema: [],
    messages: {
      missing:
        'This test is missing a {{ sections }} comment. Lay the body out given / when / then.',
      order:
        'The section comments are out of order: {{ found }}. They read given, then when, then then.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      CallExpression(node) {
        const name = testCallName(node);
        if (!name || !TEST_CALLERS.has(name)) return;

        const body = bodyOf(node);
        if (!body) return;

        const found = sourceCode
          .getCommentsInside(body)
          .map((comment) =>
            SECTIONS.find((s) => new RegExp(`^${s}\\b`, 'i').test(comment.value.trim())),
          )
          .filter(Boolean);

        const missing = SECTIONS.filter((section) => !found.includes(section));
        if (missing.length > 0) {
          context.report({
            node: node.callee,
            messageId: 'missing',
            data: { sections: missing.map((s) => `// ${s}`).join(', ') },
          });
          return;
        }

        const order = found.filter((section, i) => found.indexOf(section) === i);
        if (order.join() !== SECTIONS.join()) {
          context.report({
            node: node.callee,
            messageId: 'order',
            data: { found: order.map((s) => `// ${s}`).join(' → ') },
          });
        }
      },
    };
  },
};
