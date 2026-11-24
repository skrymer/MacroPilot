/**
 * Every colour arrives through a design token, and every class-based size does
 * too. DESIGN.md: "Style through
 * tokens. No hex values in components. A missing token is added here first,
 * then to `tailwind.config`."
 *
 * Three ways around the tokens, all reported: a colour written as a value
 * (`'#0B0F14'`, `'rgb(…)'`), a Tailwind arbitrary value (`w-[13px]`,
 * `bg-[#0B0F14]`), and a colour set in an inline style. `transparent` is
 * allowed in a style because it is the absence of a colour, not a palette
 * choice — it is what lets a navigator show the ground behind it.
 *
 * A size in an inline style is not reported: a size computed from data — a bar
 * as tall as the effort it records — has no token to be, and is exactly what
 * `style` is for.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
const { eachString } = require('./strings');

const COLOUR_VALUE = /^\s*(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgb|hsl)a?\(.*\))\s*$/i;
const ARBITRARY_CLASS = /(?:^|\s)[\w:!/.-]*-\[[^\]\s]*\]/;
const STYLE_PROP = /^(?:style|\w+Style)$/;
const COLOUR_KEY = /colou?r$/i;

const isTransparent = (node) => node.type === 'Literal' && node.value === 'transparent';

const keyName = (property) =>
  property.key.type === 'Identifier' ? property.key.name : String(property.key.value);

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Style through design tokens: no colour values, arbitrary classes or inline colours',
    },
    schema: [],
    messages: {
      colour:
        'A colour written as a value. Use a design token class; a missing token goes in DESIGN.md first, then design-tokens.js or tailwind.config.js.',
      arbitrary:
        'An arbitrary Tailwind value. Use a design token; a missing token goes in DESIGN.md first, then design-tokens.js or tailwind.config.js.',
      inlineColour:
        'A colour in an inline style or a colour prop. Colour comes from a design token class, never a value.',
    },
  },

  create(context) {
    const checkStyleObject = (object) => {
      for (const property of object.properties) {
        if (property.type !== 'Property' || property.computed) continue;
        if (COLOUR_KEY.test(keyName(property)) && !isTransparent(property.value)) {
          context.report({ node: property, messageId: 'inlineColour' });
        }
      }
    };

    return {
      ...eachString((node, text) => {
        if (COLOUR_VALUE.test(text)) context.report({ node, messageId: 'colour' });
        else if (ARBITRARY_CLASS.test(text)) context.report({ node, messageId: 'arbitrary' });
      }),

      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier') return;
        // `color="white"` on ActivityIndicator, `placeholderTextColor` on TextInput.
        if (COLOUR_KEY.test(node.name.name) && node.value?.type === 'Literal') {
          if (!isTransparent(node.value)) context.report({ node, messageId: 'inlineColour' });
          return;
        }
        if (!STYLE_PROP.test(node.name.name)) return;
        if (node.value?.type !== 'JSXExpressionContainer') return;
        const expression = node.value.expression;
        const objects = expression.type === 'ArrayExpression' ? expression.elements : [expression];
        for (const object of objects) {
          if (object?.type === 'ObjectExpression') checkStyleObject(object);
        }
      },
    };
  },
};
