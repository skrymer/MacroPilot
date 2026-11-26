import { defineConfig, enforceTdd } from '@nizos/probity';

/**
 * TDD enforcement, applied to the code and nowhere else.
 *
 * The `files` globs are a positive list on purpose. An exclusion list would have
 * to keep pace with every generated artefact the build learns to emit — `.expo/`,
 * `expo-env.d.ts`, the `ios/` tree a prebuild drops — and the first one it missed
 * would put a model call in front of a write nothing can drive test-first. Naming
 * the two source trees instead leaves `CONTEXT.md`, the ADRs
 * and every generated file outside the rule by construction.
 *
 * The lint rules and `eslint.config.js` are named too. They make the design system and the
 * platform rules mechanical, and a rule that wrongly stays silent, or a config
 * block that replaces another, weakens every screen at once — that is logic.
 *
 * Test files sit inside the globs deliberately. Writing the failing test is the
 * red step, and the rule has to see it to judge the green that follows.
 *
 * `app/design.tsx` is the one negation, and it is a carve-out rather than a
 * leak in the positive list. The page is the living design reference: it
 * renders every token and type ramp so the direction can be checked on a real
 * screen, and its check is a person looking at it. There is no
 * failing test to write before moving a swatch, so enforcing test-first there
 * would put a model call in front of every edit and refuse them all. It renders
 * no data and makes no judgement, so nothing behind the exclusion is
 * logic the domain core should have owned — the day it grows either, it stops
 * being the design page and the negation comes out.
 *
 * `fastPath` stays off. Probity's language registry recognises `.ts` and `.tsx`, so
 * a fast path would return a deterministic pass whenever a write adds exactly one
 * new test node, which is exactly the green->red boundary where the validator checks
 * whether the prior green left a refactor unmade.
 *
 * `maxContentChars` stays at its default, since Jest reports a failure in a few
 * lines. Raise it the first time a verdict reads as though it judged a truncated
 * transcript.
 *
 * `maxEvents` is raised to 20. The validator sees only the last `maxEvents` tool
 * calls, so a red run has to stay inside that window, not merely have happened.
 * Every Read, Grep and subagent report takes a slot, and once the red run is pushed
 * out the validator refuses a legitimate red and then the green too. Twenty gives
 * about one TDD cycle of interleaved reads as headroom. Not higher: a crowded
 * prompt risks the model missing recent events, which fails as a false pass.
 *
 * The validator judges "was there a genuine failing test?" from the session
 * transcript, so a test run has to reach it with its failure text intact.
 * Anything that filters the agent's command output — piping `npm test` through
 * `tail`, or `--silent` on a run whose red is the evidence — silently degrades
 * every verdict that follows.
 */
/**
 * The default rule that gates production code on an observed failing test is
 * worded loosely enough that the validator applies it to the write adding the
 * test, and refuses a red step for not having failed before it exists
 * (nizos/probity#51). This is the wording of the upstream fix, nizos/probity#52;
 * drop it once a release ships that fix. If the text it
 * replaces is gone, the defaults pass through unchanged.
 */
const OBSERVED_FAILURE_RULE = {
  loose: `  - A test added to drive new behavior must be observed failing for
    the right reason (an assertion, not a syntax or import error) in
    a prior test run before production code may be written to satisfy
    it.`,
  scoped: `  - Production code that satisfies a new test may not be written until
    that test has been observed failing for the right reason (an
    assertion, not a syntax or import error) in a prior test run. This
    gates the production write, never the write that adds the test: a
    test cannot fail before it exists, so "no failing run yet" is never
    a reason to block adding one.`,
};

function scopeObservedFailureToProductionWrites(defaults: string) {
  return defaults.replace(OBSERVED_FAILURE_RULE.loose, OBSERVED_FAILURE_RULE.scoped);
}

/**
 * Jest sees no pixels and lint refuses asserting styles, so a change to them has no failing test to
 * show (ADR 0001). The limits keep that narrow.
 */
const PIXELS_RULE = `### A change only the pixels can show

This takes precedence over the red and green rules above, for a production write of which all of
these hold. It then needs no failing test:

  - Its only effect is what is drawn: a colour, a decoration, an appearance, a platform component's
    own drawing, a render or remount made only to draw it again, or
    the space between things or inside one (a padding, a margin, a gap).
    The space inside what is pressed is this only where
    its touch target is measured too, and is made no smaller.
  - It leaves alone a value, a word, a role, a label, navigation, state or a computation, and
    a size, a touch target, what is shown or what can be pressed. A target that only grows, by the
    space inside it, is left alone.
  - The session shows, before the write, the fault on the emulator, as
    a pixel measurement in a command's output. For space that is the gap in pixels,
    which is measured again once the write has been made.
  - It is the least that could repair that fault, and the tests of the file pass.

Anything else in the same write is judged by the rules above.`;

/**
 * Jest has no keyboard and no focus, presents and scrolls no page, and lint refuses asserting the props that ask
 * for them, so they have no failing test to show either (ADR 0001).
 */
const DEVICE_RULE = `### A change only the device can show

This takes precedence over the red and green rules above, for a production write of which all of
these hold. It then needs no failing test:

  - Its only effect is what takes focus as a page opens, whether the keyboard is up, how the platform
    presents a page (full height, a sheet, its detents), or where a page is scrolled to. Scrolling
    what is already on a page into view is this, and not a change to what is shown.
  - It leaves alone a value, a word, a role, a label, where a press leads, stored data, a computation,
    and anything drawn.
  - The session shows, before the write, the fault on the emulator, as a measurement in a command's
    output: whether the keyboard is shown, what has focus, or where an element stands. A measurement
    after agent-device has pressed or filled is of its headless keyboard and is not one.
    How iOS presents a page, which the Android emulator cannot show, needs instead the user's word
    for that page, quoted in the session with its date and where it is recorded.
  - It is the least that could repair that fault, and the tests of the file pass.

Anything else in the same write is judged by the rules above.`;

function testFirstRules(defaults: string) {
  return [scopeObservedFailureToProductionWrites(defaults), PIXELS_RULE, DEVICE_RULE].join('\n\n');
}

export default defineConfig({
  rules: [
    {
      files: [
        'src/**/*.{ts,tsx}',
        'app/**/*.{ts,tsx}',
        'eslint-rules/**/*.{js,ts}',
        'eslint.config.js',
        '!app/design.tsx',
      ],
      rules: [enforceTdd({ maxEvents: 20, instructions: testFirstRules })],
    },
  ],
});
