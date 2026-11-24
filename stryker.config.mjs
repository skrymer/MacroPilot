import jestConfig from './jest.config.js';

/**
 * Mutation testing over the Jest suite. The `mutation-test` skill is the
 * workflow; this file is only what the tool needs to start.
 *
 * `mutate` here is the default scope, not the intended one. A gate run passes
 * `--mutate` scoped to the files the change touched, because mutating untouched
 * source reports old debt as if this change caused it.
 *
 * `app/design.tsx` is excluded. It is the living reference for the design system, checked by
 * a person looking at it, and it owns no behaviour a test could pin — every
 * mutant in it would survive and mean nothing.
 *
 * The runner is pointed at `jest.config.js` rather than left to discover a
 * config, because this repo runs several Jest projects: the framework-free domain
 * suite in plain node, and the screen suite on `jest-expo`. Stryker has to see
 * both to know which tests cover a mutant.
 *
 * The `tooling` project is left out. Its suites — the lint rules, the resolved
 * Expo config, the token contrast — cannot kill a mutant in `src/` or `app/`,
 * and the config test spawns the Expo CLI, so including them is pure cost on
 * every run. Stryker merges `config` over the file shallowly, so `projects`
 * here replaces the list rather than adding to it.
 *
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  packageManager: 'npm',
  // Each runner loads the whole jest-expo app project, about 2 GiB. Stryker's default of one per
  // core but one started 13 and ran the 30 GiB laptop out of memory; 8 leaves room for Metro.
  concurrency: 8,
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    config: {
      projects: jestConfig.projects.filter((project) => project.displayName !== 'tooling'),
    },
  },
  // The json report is what the mutation-test skill reads survivors from; the console is only progress.
  reporters: ['progress', 'clear-text', 'json'],
  coverageAnalysis: 'perTest',
  mutate: [
    'src/**/*.ts',
    'app/**/*.tsx',
    '!**/*.test.ts',
    '!**/*.test.tsx',
    // One to a line: the prototype skill's exempt.sh adds its own after this one.
    '!app/design.tsx',
  ],
};
