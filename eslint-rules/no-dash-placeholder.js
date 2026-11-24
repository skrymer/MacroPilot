/**
 * Never a dash, never a fallback zero (DESIGN.md, the states that matter). A
 * dash reads as zero, and zero has to stay available to mean itself: a food
 * really can have no protein in it. An absence gets words ("not logged", "no
 * figure") set in the italic that marks it as one.
 *
 * A dash is reported where it is display text: JSX text, a string inside JSX,
 * a prop value, or the fallback branch of `??`, `||` or a conditional. A dash
 * passed to a call (`split('-')`) or joining a template's parts (`${a}-${b}`)
 * is code and is left alone, and a dash inside a sentence or in front of a
 * figure is not standing in for anything.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
const { eachString } = require('./strings');

const DASH_ONLY = /^\s*[-–—]+\s*$/;

const isFallback = (node, parent) =>
  (parent.type === 'LogicalExpression' && parent.right === node && parent.operator !== '&&') ||
  (parent.type === 'ConditionalExpression' && parent.test !== node);

const isDisplayed = (ancestors) =>
  ancestors.some((a) => a.type === 'JSXExpressionContainer' || a.type === 'JSXAttribute');

/** A dash handed to a call, or joining a template's parts, is code rather than display text. */
const isCode = (target, parent) =>
  (parent.type === 'CallExpression' && parent.arguments.includes(target)) ||
  (target.type === 'TemplateLiteral' && target.expressions.length > 0);

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'No dash as display text — an absence gets words' },
    schema: [],
    messages: {
      dash: 'A dash as display text reads as zero. Say what is absent instead, e.g. "not logged" or "no figure", in italic.',
    },
  },

  create(context) {
    return {
      JSXText(node) {
        if (DASH_ONLY.test(node.value)) context.report({ node, messageId: 'dash' });
      },

      ...eachString((node, text) => {
        if (!DASH_ONLY.test(text)) return;
        const ancestors = context.sourceCode.getAncestors(node);
        // A template's text sits one level down, inside the TemplateLiteral.
        const [target, parent] =
          node.type === 'TemplateElement'
            ? ancestors.slice(-2).reverse()
            : [node, ancestors.at(-1)];
        if (!parent || isCode(target, parent)) return;
        if (isDisplayed(ancestors) || isFallback(target, parent)) {
          context.report({ node, messageId: 'dash' });
        }
      }),
    };
  },
};
