/**
 * `z.coerce.number()` runs a field's text through `Number()`, so a blank is 0: a figure nobody gave
 * becomes a fact in the log (ADR 0009). `.optional()` is no help, since the coercion came first.
 *
 * @type {import('eslint').Rule.RuleModule}
 */

/** What a member expression reads, written `a.name` or `a['name']`; otherwise an identifier's name. */
const nameOf = (node) => {
  if (node.type === 'Identifier') return node.name;
  if (node.type !== 'MemberExpression') return null;
  return node.computed ? node.property.value : node.property.name;
};

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'No z.coerce.number(), which makes a 0 of a blank' },
    schema: [],
    messages: {
      coerced:
        'z.coerce.number() makes a blank field 0. Use the translation in src/components/figureText.ts, where a blank is not stated (ADR 0009).',
    },
  },

  create(context) {
    return {
      MemberExpression(node) {
        if (nameOf(node) !== 'number' || nameOf(node.object) !== 'coerce') return;
        context.report({ node, messageId: 'coerced' });
      },
    };
  },
};
