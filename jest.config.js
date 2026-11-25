/**
 * The domain suite runs in plain node, because the domain core is
 * framework-free (ADR 0002) and pays nothing for React Native's test
 * environment. The interesting code (macro arithmetic, portion scaling, day
 * boundaries) stays fast enough to run on every keystroke. Only screens
 * and the storage and lifecycle adapters pay for `jest-expo`.
 *
 * @type {import('jest').Config}
 */
// Every suite reads the clock on the wall as UTC, wherever it runs, so a screen that names the
// local time of day reads the same on a laptop in Copenhagen and on CI. Workers inherit it.
process.env.TZ = 'UTC';

const NODE_PROJECT = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['babel-jest', { configFile: './babel.config.js' }],
  },
};

module.exports = {
  globalSetup: './tests/ownTmpdir.js',
  globalTeardown: './tests/removeOwnTmpdir.js',
  projects: [
    {
      ...NODE_PROJECT,
      displayName: 'domain',
      testMatch: ['<rootDir>/src/domain/**/*.test.ts'],
    },
    // The rules the tooling enforces — the lint rules, the resolved Expo config,
    // the token contrast — and the skills' scripts and Claude's hooks. None of it renders, so it runs in plain node beside
    // the domain suite.
    {
      ...NODE_PROJECT,
      displayName: 'tooling',
      testMatch: [
        '<rootDir>/eslint-rules/**/*.test.ts',
        '<rootDir>/tests/**/*.test.ts',
        '<rootDir>/.claude/skills/**/*.test.ts',
        '<rootDir>/.claude/hooks/**/*.test.ts',
      ],
    },
    {
      displayName: 'app',
      preset: 'jest-expo',
      testMatch: [
        '<rootDir>/app/**/*.test.tsx',
        '<rootDir>/src/components/**/*.test.{ts,tsx}',
        '<rootDir>/src/storage/**/*.test.ts',
        '<rootDir>/src/lifecycle/**/*.test.ts',
      ],
    },
  ],
};
