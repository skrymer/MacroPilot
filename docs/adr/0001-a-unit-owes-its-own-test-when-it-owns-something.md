# A unit owes its own test when it owns something; everything else is driven through the screen

Everything here is built test-first, but for what only the pixels or the device can show (below), and that settles *how* a test is written. It does not settle **which units get their own test and which are left to a higher-level one**. Answering that per feature risks the two failures either side: a mock-heavy test for code that has no rule of its own, or a genuine rule reachable only through a rendered screen that cannot easily put it at its boundary. `mutation-test`'s survivor triage needs the answer too: one of its verdicts is *killed by an out-of-scope layer*, and without a recorded rule about where a behaviour's red lives, that verdict is indistinguishable from an excuse.

## The rule

**A unit owes its own test exactly when it owns something.**

| It owns | Which means | Its own test is |
| --- | --- | --- |
| **An invariant** | it refuses to be constructed wrong | Jest, no render: construct the bad value and be refused |
| **A judgement** | it turns reported facts into a verdict | Jest, no render, over plain values or fakes of its ports |
| **A translation** | it converts an external contract into ours | a test over the real contract: recorded provider responses, or the real SQL against a real SQLite ([`0008`](./0008-sql-is-tested-against-better-sqlite3-behind-a-narrow-port.md)) |

**Everything else owns nothing: it carries.** A screen that arranges values, a hook that wires a store to a component, a formatter that projects a domain value onto a string. Its red lives in the screen test, and giving it a standalone one would mean mocking internal collaborators to have something to assert.

The dividing question is **"what would a wrong version of this file be lying about: the food, the day, or the wiring?"**

## The screen is this project's endpoint

There is no server, and so no HTTP boundary to drive a feature through ([`0003`](./0003-data-and-rules-live-on-the-device.md)). So **the screen is the seam a feature is driven through**: rendered with `@testing-library/react-native` over fake ports, and asserted on what the user would perceive. A slice that adds a code path adds a case there.

## The mocking ruling

**Only a true external boundary is stubbed. Internal collaborators are never mocked.** The boundaries are listed here, and adding one is a decision recorded in this list rather than an import:

- **The wall clock**, behind the `Clock` port, which also carries the phone's UTC offset. Which **day** a meal at 23:30 belongs to is a clock and time-zone judgement, so a test must be able to put the phone outside UTC. `Date.now()` is refused by lint.
- **Persistent storage**: `expo-sqlite`, behind a port. A store that keeps tables takes a narrow `SqlDatabase`, backed in its own test by `better-sqlite3`.
- **The system's own question** (an action sheet, a dialog), behind an `Ask` port that says what is asked and answers yes or no. The platform draws it and answers it outside React, so no screen test can press *Delete* or *Cancel* on it. Its adapter is driven on the emulator, and on the iPhone with the epic.

Expected, and added here by the slice that first needs each: the nutrition providers over the network, the camera that reads a barcode, and local notifications.

A **fake of a port is not a mock of an internal collaborator.** It is a second implementation of an interface, written to be driven rather than to record calls. It says only what the real thing could say, and exposes no log of the calls the app made. No test needs a mocking framework beyond Jest's own module mocking at these boundaries.

**What Jest cannot load is not a boundary.** The root-layout test stubs `global.css`, which NativeWind compiles in Metro, and relies on jest-expo's mocks of native modules. No test asserts anything through them. A stub a test asserts behaviour through is a boundary, and belongs on the list or nowhere.

## The test layers this repo has

**A layer named in a triage verdict must appear here.**

| Layer | Tool | What lives here |
| --- | --- | --- |
| Domain values and pure rules | Jest, plain node | macro arithmetic, portion scaling, day boundaries, targets, the trend |
| Translations | Jest over the real contract | SQL stores, provider responses |
| Screens, the seam a feature is driven through | Jest + RNTL + fake ports | co-located `*.test.tsx` |
| Components | Jest + RNTL | co-located `*.test.tsx` |
| Tooling rules | Jest, plain node | lint rules driven through the real `eslint.config.js`, the resolved Expo config, token contrast, skill scripts, hooks |

One more is not a suite: **`/verify`**, on the Android emulator for an issue and the iPhone for an epic ([`0004`](./0004-an-issue-is-verified-on-the-emulator-and-an-epic-on-the-iphone.md)). How a screen looks (colour, safe areas, clipping at the largest text) is its, because Jest cannot see it without asserting on styles, which the screen tests refuse.

**So a change only the pixels can show is driven by a measurement.** Test-first is enforced by probity, which would refuse it: a tab bar that kept the old appearance has no failing test, however plainly it is wrong. Its red is the fault measured in the pixels of the emulator's screen before the write, and its green is the same measured after. Probity reads what a command printed and never an image, so a photograph alone shows it nothing. **The space between things, or inside one, is drawn like a colour**: a padding, a margin or a gap, with the gap measured in pixels before the write and after it. Two parts of Log touched on the emulator (a gap of 0 where 10.5dp, the gap between the parts above them, was meant), and the padding that would part them was refused as a size. The space inside what is pressed is part of it only where the touch target is measured too, before and after, and is made no smaller: a button whose words take two lines has no space above and below them, and leaving that space out left no way to give it any. A size and what is shown stay out of it. `probity.config.ts` carries the limits. Anything Jest can see keeps its failing test.

**The same holds for what only the device can show**: what takes focus as a page opens, whether the keyboard is up, how the platform presents a page, and where a page is scrolled to. React Native's Jest mock of `TextInput` focuses nothing, Jest presents no sheet and scrolls no list, and asserting the prop that asks for either is refused by `testing/perceivable-only`, rightly, since it would pass while the keyboard stayed down. Its red is the fault measured on the emulator by a command (`dumpsys input_method`, the focused node, where an element stands) and its green is the same measured after, over the system's keyboard and not the headless one `agent-device` types with. It covers those four things and nothing a press leads to, a word or a figure says, or a test can drive.

**There is no Maestro or Detox suite**, and neither may be cited as if there were.

## Alternatives rejected

- **A test per file.** Mock-heavy tests coupled to structure, which break on refactor without a behaviour change.
- **Only screen tests.** A screen test shows that one bad input was handled; it cannot show that a bad value is *unconstructible*, and the arithmetic has to be driven at boundary values a rendered screen cannot conveniently reach.
- **Asserting the colours handed to the platform.** A test of the props a native component was given shows that they changed and not that they were drawn, and nothing in it can see a fault in the platform's own drawing.
- **A line-coverage threshold in CI.** Coverage says a line ran, not that anything would notice it change, which is the gap mutation testing exists to close.

## Consequences

- "Does this get its own test?" has a mechanical answer.
- The screen test is load-bearing and grows with the feature.
- This is a coverage rule, not a TDD rule. Everything Jest can see is still built test-first; this fixes only *where* each behaviour's red lives.
