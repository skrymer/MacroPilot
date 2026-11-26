/**
 * A form of more than one field can put its fault out of view on a phone, so it brings the first
 * into view (`useFirstFault`) and says by its button that a field above needs changing
 * (`formFault`). The second such form was built without either until a review asked.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'A form of several fields shows its first fault' },
    schema: [],
    messages: {
      hidden:
        'A form of several fields can hide its fault: call useFirstFault, and pass formFault(errors) to the page.',
    },
  },

  create(context) {
    const fields = [];
    const called = new Set();
    return {
      'JSXOpeningElement[name.name="FormField"]': (node) => {
        // One written inside a `map` stands for as many as its list holds.
        const mapped = context.sourceCode
          .getAncestors(node)
          .some((up) => up.type === 'CallExpression' && up.callee.property?.name === 'map');
        fields.push(node);
        if (mapped) fields.push(node);
      },
      'CallExpression[callee.type="Identifier"]': (node) => called.add(node.callee.name),
      'Program:exit': () => {
        const shown = called.has('useFirstFault') && called.has('formFault');
        if (fields.length > 1 && !shown) context.report({ node: fields[0], messageId: 'hidden' });
      },
    };
  },
};
