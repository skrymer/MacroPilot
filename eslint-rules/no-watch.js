const FORM_HOOKS = ['useForm', 'useFormContext'];

const isForm = (node) => FORM_HOOKS.includes(node?.callee?.name);

/**
 * The React Compiler cannot safely memoise what a form's `watch()` returns, so a screen showing it
 * goes stale (ADR 0009). `useWatch` reads a live value.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: "No watch() of a form's; useWatch instead" },
    schema: [],
    messages: {
      watch:
        'A value read through watch() goes stale under the React Compiler. Use useWatch (ADR 0009).',
    },
  },

  create(context) {
    const forms = new Set();
    return {
      'CallExpression > MemberExpression.callee[property.name="watch"]'(node) {
        context.report({ node, messageId: 'watch' });
      },
      VariableDeclarator({ id, init }) {
        if (id.type === 'Identifier' && isForm(init)) forms.add(id.name);
        if (id.type !== 'ObjectPattern' || !(isForm(init) || forms.has(init?.name))) return;
        for (const property of id.properties) {
          if (property.key?.name === 'watch') {
            context.report({ node: property, messageId: 'watch' });
          }
        }
      },
    };
  },
};
