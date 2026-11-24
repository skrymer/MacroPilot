/** The text of a string literal or of a template literal's fixed part; null for any other node. */
const stringValue = (node) => {
  if (node.type === 'Literal') return typeof node.value === 'string' ? node.value : null;
  if (node.type === 'TemplateElement') return node.value.cooked ?? node.value.raw;
  return null;
};

/**
 * Calls `visit(node, text)` for every piece of string source in a file: string
 * literals and the fixed parts of template literals. A class list is just a
 * string to ESLint, wherever it is kept — in `className`, in a lookup table, in
 * a variable — so the design rules look at all of them rather than only at the
 * attribute.
 *
 * @param {(node: import('estree').Node, text: string) => void} visit
 */
const eachString = (visit) => {
  const check = (node) => {
    const text = stringValue(node);
    if (text !== null) visit(node, text);
  };
  return { Literal: check, TemplateElement: check };
};

module.exports = { eachString, stringValue };
