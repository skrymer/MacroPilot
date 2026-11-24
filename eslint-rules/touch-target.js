/**
 * Every pressable control (see `isPressable`) is a target of at least its platform's floor, 44pt on
 * iOS and 48dp on Android (DESIGN.md, *Controls*). With one hand, in a kitchen, a target that is
 * merely visible is not one a user can hit.
 *
 * Satisfied by the `min-h-target` and `min-w-target` tokens together, or by a
 * `hitSlop` that extends a smaller visual. The Tailwind numeric scale does not
 * count: it is rem-based, and NativeWind's native rem is 14, so `h-11` is
 * 38.5pt on an iPhone, not the 44 it is on the web.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
const { attribute, isPressable, staticText } = require('./jsx');

const FLOOR = ['min-h-target', 'min-w-target'];

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: "Every Pressable is at least its platform's floor" },
    schema: [],
    messages: {
      small:
        'This Pressable may be under 44pt on iOS or 48dp on Android. Give it `min-h-target min-w-target`, or a `hitSlop` that makes up the difference.',
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        if (!isPressable(node)) return;
        if (attribute(node, 'hitSlop')) return;
        const classes = staticText(attribute(node, 'className')).split(/\s+/);
        if (FLOOR.every((floor) => classes.includes(floor))) return;
        context.report({ node, messageId: 'small' });
      },
    };
  },
};
