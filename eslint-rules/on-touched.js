/**
 * A field is judged once it is left, then again as it is typed, so a red one turns green the moment
 * it is fixed (DESIGN.md, *Forms*). React Hook Form's default, `onSubmit`, judges only a refused save.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: "A form's useForm sets mode: 'onTouched'" },
    schema: [],
    messages: {
      mode: "A form judged only when sent shows no field fixed as it is typed. Set mode: 'onTouched' (DESIGN.md, Forms).",
    },
  },

  create(context) {
    return {
      'CallExpression[callee.name="useForm"]'(node) {
        const mode = node.arguments[0]?.properties?.find(
          (property) => property.key?.name === 'mode',
        );
        if (mode?.value.value === 'onTouched') return;
        context.report({ node, messageId: 'mode' });
      },
    };
  },
};
