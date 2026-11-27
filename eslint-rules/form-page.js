/**
 * Every form is a `FormPage` (DESIGN.md, *Forms*): it keeps the button above the keyboard, the fields
 * clear of iOS's glass bar, the fields in their card, the X and *Not saved…*. A form that draws its
 * own loses them without a test noticing.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'A form’s fields stand in FormPage' },
    schema: [],
    messages: {
      field:
        'A form’s fields stand in FormPage, which keeps its button above the keyboard and its fields clear of iOS’s bar (DESIGN.md, Forms).',
      avoiding:
        'Only FormPage keeps the keyboard off a button: it knows where the page starts in its sheet or under the bar (DESIGN.md, Forms).',
    },
  },

  create(context) {
    // A test may render a field alone, to test the field: it is not a form.
    if (/\.test\.tsx?$/.test(context.filename)) return {};
    const inFormPage = (node) => {
      for (let at = node.parent; at; at = at.parent) {
        if (at.type === 'JSXElement' && at.openingElement.name.name === 'FormPage') return true;
      }
      return false;
    };
    return {
      'JSXOpeningElement[name.name="FormField"]'(node) {
        if (!inFormPage(node.parent)) context.report({ node, messageId: 'field' });
      },
      'JSXOpeningElement[name.name="KeyboardAvoidingView"]'(node) {
        if (!context.filename.endsWith('src/components/FormPage.tsx')) {
          context.report({ node, messageId: 'avoiding' });
        }
      },
    };
  },
};
