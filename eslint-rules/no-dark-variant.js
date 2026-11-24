/**
 * Light and dark are the tokens' business: each colour token has a value per
 * appearance (`design-tokens.js`), so a `dark:` variant in a component is a
 * second, unchecked palette. The missing token is what should be added.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
const { eachString } = require('./strings');

const DARK_VARIANT = /(?:^|\s)(?:[\w-]+:)*dark:\S/;

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'No dark: variant; the tokens switch with the appearance' },
    schema: [],
    messages: {
      dark: 'A dark: variant, and the tokens already switch with the appearance. Use a token class; a missing token goes in DESIGN.md first, then design-tokens.js.',
    },
  },

  create(context) {
    return eachString((node, text) => {
      if (DARK_VARIANT.test(text)) context.report({ node, messageId: 'dark' });
    });
  },
};
