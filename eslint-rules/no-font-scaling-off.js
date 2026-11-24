/**
 * Text follows the user's text size. DESIGN.md requires the app to be legible
 * at 200%, and `allowFontScaling={false}` opts a piece of text out of that
 * entirely. Where a size genuinely cannot grow without breaking — the wattage
 * is sized to the screen width — the answer is a cap, `maxFontSizeMultiplier`,
 * which keeps scaling up to a ceiling rather than refusing it.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Never switch font scaling off' },
    schema: [],
    messages: {
      off: 'Font scaling switched off. Text must stay legible at 200%; cap it with maxFontSizeMultiplier instead.',
    },
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'allowFontScaling') return;
        const value = node.value;
        const isFalse =
          value?.type === 'JSXExpressionContainer' &&
          value.expression.type === 'Literal' &&
          value.expression.value === false;
        if (isFalse) context.report({ node, messageId: 'off' });
      },
    };
  },
};
