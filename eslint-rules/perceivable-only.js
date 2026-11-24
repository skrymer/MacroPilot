/**
 * A test asserts what the user perceives: text, roles, and what VoiceOver
 * reads. React Native's testing guide says to avoid "making assertions on
 * component props or state", and the `component-testing-best-practices` skill
 * says never to assert on styles. A test that reads a prop passes while the
 * screen is wrong and fails when a refactor changes nothing a user would see.
 */

/**
 * Props the system reads on the user's behalf: VoiceOver reads the accessibility
 * props, and iOS reads the scaling cap for Larger Text. A user perceives these
 * through assistive technology, so asserting them is asserting what the user
 * gets, the "accessibility helpers" React Native's testing guide prefers.
 */
const READ_BY_THE_SYSTEM = /^(accessibility|aria-|role$|maxFontSizeMultiplier$)/;

const readByTheSystem = (argument) =>
  argument?.type === 'Literal' &&
  typeof argument.value === 'string' &&
  READ_BY_THE_SYSTEM.test(argument.value);

/** The message for a call by its method name, or undefined when the call is fine. */
const reportedCall = (method, args) => {
  if (method === 'toHaveStyle') return 'style';
  if (method === 'toHaveProp' && !readByTheSystem(args[0])) return 'props';
  if (/^toMatch(Inline)?Snapshot$/.test(method)) return 'snapshot';
  if (method.endsWith('ByTestId')) return 'testId';
  if (method.startsWith('UNSAFE_')) return 'tree';
  return undefined;
};

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Tests assert what the user perceives, never implementation details' },
    schema: [],
    messages: {
      props:
        'A prop is an implementation detail. Assert on visible text, a role or what VoiceOver reads (component-testing-best-practices).',
      style:
        'A style is an implementation detail, and Jest cannot see how iOS draws it. Assert on what the user perceives; how it looks is /verify (ADR 0001).',
      snapshot:
        'A snapshot calls whatever rendered correct, even when it is wrong. Write the explicit expectation instead (React Native testing guide: "prefer explicit expectations").',
      testId:
        'A test ID is invisible to the user and to VoiceOver. Find the element by its role and name, its label or its text (component-testing-best-practices, query priority).',
      tree: 'The component tree is an implementation detail. Find the element as a user would: by role, label or text.',
      fireEvent:
        'fireEvent skips what a real press does. Use userEvent.setup() and await each interaction (component-testing-best-practices).',
      renderer: "React's test renderer is deprecated. Render with @testing-library/react-native.",
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === 'react-test-renderer') {
          context.report({ node, messageId: 'renderer' });
        }
      },
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'MemberExpression' || callee.property.type !== 'Identifier') return;
        const messageId = reportedCall(callee.property.name, node.arguments);
        if (messageId) context.report({ node, messageId });
      },
      MemberExpression(node) {
        if (node.property.type !== 'Identifier') return;
        const object = node.object.type === 'Identifier' ? node.object.name : undefined;
        if (node.property.name === 'props') context.report({ node, messageId: 'props' });
        if (object === 'fireEvent') context.report({ node, messageId: 'fireEvent' });
        if (object === 'screen' && node.property.name === 'root') {
          context.report({ node, messageId: 'tree' });
        }
      },
    };
  },
};
