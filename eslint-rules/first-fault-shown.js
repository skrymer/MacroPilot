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
    let first;
    let several = false;
    const called = new Set();
    // One written inside a `map` stands for as many as its list holds.
    const isMapped = (node) =>
      context.sourceCode
        .getAncestors(node)
        .some((up) => up.type === 'CallExpression' && up.callee.property?.name === 'map');
    return {
      // A choice or a date is drawn through a Controller, and can be out of view as a text field can.
      'JSXOpeningElement[name.name=/^(FormField|Controller)$/]': (node) => {
        several ||= first !== undefined || isMapped(node);
        first ??= node;
      },
      'CallExpression[callee.name=/^(useFirstFault|formFault)$/]': (node) =>
        called.add(node.callee.name),
      'Program:exit': () => {
        if (several && called.size < 2) context.report({ node: first, messageId: 'hidden' });
      },
    };
  },
};
