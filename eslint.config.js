// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');
const givenWhenThen = require('./eslint-rules/given-when-then');
const perceivableOnly = require('./eslint-rules/perceivable-only');
const cappedText = require('./eslint-rules/capped-text');
const noWatch = require('./eslint-rules/no-watch');
const noFontScalingOff = require('./eslint-rules/no-font-scaling-off');
const pressableRole = require('./eslint-rules/pressable-role');
const touchTarget = require('./eslint-rules/touch-target');
const keyboardAvoided = require('./eslint-rules/keyboard-avoided');
const noCoercedNumber = require('./eslint-rules/no-coerced-number');
const noDarkVariant = require('./eslint-rules/no-dark-variant');
const noDashPlaceholder = require('./eslint-rules/no-dash-placeholder');
const tokensOnly = require('./eslint-rules/tokens-only');
const firstFaultShown = require('./eslint-rules/first-fault-shown');

/**
 * The domain core is framework-free, and this rule is what enforces it — see
 * docs/adr/0002. Removing it to unblock something is reversing that decision,
 * and should be argued as such.
 */
const FRAMEWORK_FREE_DOMAIN = {
  files: ['src/domain/**/*.ts', 'src/domain/**/*.tsx'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              'react',
              'react/**',
              'react-native',
              'react-native/**',
              'react-native-*',
              'expo',
              'expo-*',
              '@expo/**',
              'nativewind',
            ],
            message:
              'src/domain/ is pure TypeScript (ADR 0002). The domain core computes; the UI presents.',
          },
          {
            group: ['@/storage/**', '**/storage/**', '@/lifecycle/**', '**/lifecycle/**'],
            message:
              'src/domain/ does not depend on an adapter or a port (ADR 0002). Dependencies point inwards: they import the domain, never the reverse.',
          },
        ],
      },
    ],
  },
};

/**
 * Every test reads given / when / then. A convention nothing checks is a
 * convention that survives exactly as long as the person who remembers it, and
 * this one is worth more than that: the sections are where a test that quietly
 * grew a second action becomes visible.
 */
const GIVEN_WHEN_THEN = {
  files: ['**/*.test.ts', '**/*.test.tsx'],
  plugins: { local: { rules: { 'given-when-then': givenWhenThen } } },
  rules: { 'local/given-when-then': 'error' },
};

/**
 * A screen or component test asserts what the user perceives, through text,
 * roles and accessibility, as React Native's testing guide recommends. The rule
 * stops a test reaching for props, styles, snapshots or test IDs; the
 * `component-testing-best-practices` skill says what to write instead.
 */
const PERCEIVABLE_ONLY = {
  files: ['app/**/*.test.tsx', 'src/**/*.test.tsx'],
  plugins: { testing: { rules: { 'perceivable-only': perceivableOnly } } },
  rules: { 'testing/perceivable-only': 'error' },
};

/** Every rule in a local plugin, switched on as an error under the plugin's prefix. */
const allErrors = (prefix, plugin) =>
  Object.fromEntries(Object.keys(plugin.rules).map((rule) => [`${prefix}/${rule}`, 'error']));

/** The code a screen is built from: every rule below reaches it. */
const SOURCE = {
  files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
};

/**
 * The design system, made mechanical. Each rule is a guardrail DESIGN.md states in prose;
 * the `platform-conventions` skill maps every one to its reason and to what to
 * write instead.
 */
const designPlugin = {
  rules: {
    'tokens-only': tokensOnly,
    'no-dark-variant': noDarkVariant,
    'no-dash-placeholder': noDashPlaceholder,
  },
};

const DESIGN = {
  ...SOURCE,
  plugins: { design: designPlugin },
  rules: allErrors('design', designPlugin),
};

/**
 * The accessibility floor: every target at its platform's own, every control named for what it
 * is, every piece of text free to grow.
 */
const a11yPlugin = {
  rules: {
    'touch-target': touchTarget,
    'pressable-role': pressableRole,
    'no-font-scaling-off': noFontScalingOff,
    'capped-text': cappedText,
  },
};

const A11Y = {
  ...SOURCE,
  plugins: { a11y: a11yPlugin },
  rules: allErrors('a11y', a11yPlugin),
};

/** How a form may not be written (ADR 0009). */
const formsPlugin = {
  rules: {
    'first-fault-shown': firstFaultShown,
    'keyboard-avoided': keyboardAvoided,
    'no-coerced-number': noCoercedNumber,
    'no-watch': noWatch,
  },
};

const FORMS = {
  ...SOURCE,
  plugins: { forms: formsPlugin },
  rules: allErrors('forms', formsPlugin),
};

/** The components that wrap an uncapped text component, so they can cap it. */
const CAPPED_TEXT_HOMES = {
  files: ['src/components/Text.tsx', 'src/components/Link.tsx', 'src/components/Input.tsx'],
  rules: { 'a11y/capped-text': 'off' },
};

/**
 * The clock is injected, never reached for (ADR 0001): a day decided by
 * the wall clock can only be tested by waiting for midnight. `Date.now()`, `new Date()` with
 * no argument, a bare `Date()` and `performance.now()` are the ways to read it. The one
 * module that adapts the real clock is where this gets switched off, by name.
 */
const CLOCK_MESSAGE =
  'The clock is injected, never reached for (ADR 0001). Take a clock as a parameter.';

const INJECTED_CLOCK = {
  ...SOURCE,
  rules: {
    'no-restricted-properties': [
      'error',
      { object: 'Date', property: 'now', message: CLOCK_MESSAGE },
      { object: 'performance', property: 'now', message: CLOCK_MESSAGE },
    ],
    'no-restricted-syntax': [
      'error',
      { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: CLOCK_MESSAGE },
      { selector: "CallExpression[callee.name='Date']", message: CLOCK_MESSAGE },
    ],
  },
};

/** The one module that adapts the real clock, named so the exemption cannot spread. */
const SYSTEM_CLOCK = {
  files: ['src/lifecycle/SystemClock.ts'],
  rules: {
    'no-restricted-properties': [
      'error',
      { object: 'performance', property: 'now', message: CLOCK_MESSAGE },
    ],
  },
};

/**
 * An absence is never a modal. An unlogged day, a food with no figure, a
 * refused permission: each is a state the screen states in place, quietly
 * (DESIGN.md). `Alert` is the API that makes the other choice.
 */
const NO_ALERT = {
  files: ['app/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react-native',
            importNames: ['Alert'],
            message:
              'An absence is never a modal (DESIGN.md). State it on the screen, in place, in the words for that state.',
          },
        ],
      },
    ],
  },
};

/**
 * A no-break space keeps a figure with its unit, and typed as the character it looks like any space:
 * a rewrite of the line lost one unseen. In strings, templates and JSX text too, so it is written
 * `\u00a0`, where it can be seen.
 */
const VISIBLE_WHITESPACE = {
  files: ['**/*.{js,mjs,ts,tsx}'],
  rules: {
    'no-irregular-whitespace': [
      'error',
      { skipStrings: false, skipTemplates: false, skipJSXText: false, skipRegExps: false },
    ],
  },
};

module.exports = defineConfig([
  expoConfig,
  VISIBLE_WHITESPACE,
  FRAMEWORK_FREE_DOMAIN,
  GIVEN_WHEN_THEN,
  PERCEIVABLE_ONLY,
  DESIGN,
  A11Y,
  CAPPED_TEXT_HOMES,
  FORMS,
  INJECTED_CLOCK,
  SYSTEM_CLOCK,
  NO_ALERT,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
]);
