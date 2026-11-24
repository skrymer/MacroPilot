/**
 * Every pressable control (see `isPressable`) says what it is, with `role` or
 * `accessibilityRole`. Without one, VoiceOver
 * reads the label and nothing tells the user it can be pressed — and a screen
 * test cannot find it with `getByRole`, which is the query the tests reach for
 * first.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
const { attribute, isPressable } = require('./jsx');

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Every Pressable declares an accessibilityRole' },
    schema: [],
    messages: {
      role: 'This Pressable declares no role. Say what it is — usually "button", or "link" for navigation.',
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        if (
          isPressable(node) &&
          !attribute(node, 'accessibilityRole') &&
          !attribute(node, 'role')
        ) {
          context.report({ node, messageId: 'role' });
        }
      },
    };
  },
};
