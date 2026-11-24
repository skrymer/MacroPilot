const { stringValue } = require('./strings');

/**
 * Whether a JSX element is a pressable control: `Pressable`, a member form such
 * as `Animated.Pressable`, or one of the legacy `Touchable*` components. All of
 * them are targets a user presses, so the touch-target and role rules hold
 * them to the same floor.
 */
const isPressable = (node) => {
  const name =
    node.name.type === 'JSXIdentifier'
      ? node.name.name
      : node.name.type === 'JSXMemberExpression'
        ? node.name.property.name
        : null;
  return name === 'Pressable' || /^Touchable[A-Z]/.test(name ?? '');
};

/** The attribute named `name` on a JSX opening element, if it is written there. */
const attribute = (node, name) =>
  node.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === name);

/** Every fixed piece of string in an attribute's value, joined: what a class list can be read from. */
const staticText = (attr) => {
  const strings = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    const text = stringValue(node);
    if (text !== null) strings.push(text);
    for (const [key, child] of Object.entries(node)) {
      if (key === 'parent') continue;
      if (Array.isArray(child)) child.forEach(walk);
      else if (child && typeof child.type === 'string') walk(child);
    }
  };
  walk(attr?.value);
  return strings.join(' ');
};

module.exports = { isPressable, attribute, staticText };
