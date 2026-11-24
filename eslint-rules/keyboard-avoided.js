const { attribute } = require('./jsx');

/** The name of a JSX element's tag, where it is a plain one. */
const tagOf = (node) =>
  node.type === 'JSXElement' && node.openingElement.name.type === 'JSXIdentifier'
    ? node.openingElement.name.name
    : null;

/** With no `behavior` React Native draws a plain View, which avoids nothing. */
const avoidsKeyboard = (node) =>
  tagOf(node) === 'KeyboardAvoidingView' && Boolean(attribute(node.openingElement, 'behavior'));

/**
 * A form that scrolls makes room for the keyboard, so that it never hides the field being typed in or
 * the action that commits it (DESIGN.md, *Asking and telling*). Without it the keyboard lies over
 * the end of the form, which then cannot be scrolled clear: at double text on a small phone that is
 * the last field and the button. No test sees it, since Jest has no keyboard.
 *
 * Satisfied by a `KeyboardAvoidingView` with a `behavior`, around the scroll view.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'A form that scrolls makes room for the keyboard' },
    schema: [],
    messages: {
      covered:
        'The keyboard can cover the end of this form. Put its ScrollView in a KeyboardAvoidingView with a behavior.',
    },
  },

  create(context) {
    return {
      'JSXOpeningElement[name.name="FormField"]'(node) {
        const around = context.sourceCode.getAncestors(node);
        const scrolls = around.findLastIndex((ancestor) => tagOf(ancestor) === 'ScrollView');
        if (scrolls === -1 || around.slice(0, scrolls).some(avoidsKeyboard)) return;
        context.report({ node, messageId: 'covered' });
      },
    };
  },
};
