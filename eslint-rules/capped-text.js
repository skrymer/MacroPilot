/**
 * Text reaches the screen through the app's own components, which cap font
 * scaling from the size token (ADR 0007). Each import below draws React
 * Native's text or field without the cap, so it is refused in favour of its
 * replacement. Each replacement is switched off for this rule by name in
 * `eslint.config.js`.
 */

/** module → imported name → the app's capped replacement */
const UNCAPPED = {
  'react-native': { Text: '@/components/Text', TextInput: '@/components/Input' },
  'expo-router': { Link: '@/components/Link' },
};

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: "Draw text only through the app's capped components" },
    schema: [],
    messages: {
      uncapped:
        "Use the app's own from {{replacement}} instead of {{name}}. This one draws React Native's own, skipping the font-scaling cap (ADR 0007).",
    },
  },

  create(context) {
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };

    /** An import or re-export from a banned module, by name or whole. */
    function check(node) {
      const banned = node.source && UNCAPPED[node.source.value];
      if (!banned) return;
      const whole = Object.keys(banned)[0];
      if (node.type === 'ExportAllDeclaration') {
        context.report({
          node,
          messageId: 'uncapped',
          data: { name: whole, replacement: banned[whole] },
        });
        return;
      }
      for (const specifier of node.specifiers) {
        const name =
          specifier.type === 'ImportNamespaceSpecifier'
            ? whole
            : specifier.type === 'ImportSpecifier' || specifier.type === 'ExportSpecifier'
              ? (specifier.imported ?? specifier.local).name
              : undefined;
        if (name && banned[name]) {
          context.report({
            node: specifier,
            messageId: 'uncapped',
            data: { name, replacement: banned[name] },
          });
        }
      }
    }
  },
};
