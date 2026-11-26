/**
 * A screen reaches a control only through a component in `src/components/` (see `isPressable`), so
 * that every control carries the platform's press and its target (DESIGN.md, *Controls*). A
 * `Pressable` written on a screen shows nothing when pressed unless whoever wrote it remembered,
 * and a person cannot tell whether the tap landed.
 *
 * The components themselves are where a `Pressable` belongs, and `eslint.config.js` switches the
 * rule off there by name.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
const { isPressable } = require('./jsx');

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'A screen reaches a control through a component' },
    schema: [],
    messages: {
      bare: "A screen draws no control of its own. Use `Button`, `Row`, `Link` or another component in src/components/, which carry the platform's press and the target.",
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        if (isPressable(node)) context.report({ node, messageId: 'bare' });
      },
    };
  },
};
