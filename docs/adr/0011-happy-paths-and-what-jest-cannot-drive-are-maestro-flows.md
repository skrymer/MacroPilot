# Happy paths, and what Jest cannot drive, are Maestro flows run on the emulator at every verify

Jest drives a screen through React Native's test renderer, which has no gestures, draws no system header, presents no sheet and scrolls no list. So until now a swipe, a page title the system draws, or a form presented over a tab had no test at all: it was measured on the emulator by a command once, in the session that wrote it, and nothing ran it again. A change the next week could break the swipe to delete and every gate would pass. Epic 1's happy paths were walked by hand at each verify for the same reason. (Decided by the user on 27 November 2026, in a grilling during #86, when the swipe to delete could be neither tested in Jest nor written under probity.)

## The decision

**A suite of Maestro flows lives in `e2e/`, and the agent runs all of it on the Android emulator at every issue's verify and every epic's walk.** A failing flow blocks the merge as a red Jest test does. It is not run in CI.

**A flow covers one of two things, and nothing Jest can drive:**

- **A happy path**: what a release lets the user do, each feature once, the way it is meant to be used.
- **Behaviour Jest cannot drive**: a gesture, what the system draws (a page's title, the tab bar, the system's question), how a page is presented, focus and the keyboard as a page opens, where a page is scrolled to, a cold start or a link. **A failing run of its flow, printed by `agent-device test`, is the red that licenses the write** (ADR 0001), and its passing run the green.

**Pixels stay with the measurement scripts.** A flow sees that *Delete* is visible, not that it is red or 16dp in: colour, spacing and size are still measured by `pixels.mjs` and `spacing.mjs` before and after the write, and screenshots are never compared against approved ones (ADR 0004).

**The flows are Maestro YAML, run by agent-device** (`agent-device test e2e/ --maestro --platform android`), not by Maestro's own CLI. agent-device already drives the emulator and is pinned; it runs Maestro's syntax with its own engine, fails loudly on syntax it does not support, and needs no Java. The files stay Maestro's, so that real Maestro can read them the day they run on an iOS simulator on EAS.

**A flow selects by accessibility label, never by a test ID.** A control a flow cannot find by its label is an accessibility gap, and the fix is the label (ADR 0004). One exception, a divergence of agent-device's, found writing epic 1's flows: on Android it names a node by its text, or an empty field's hint, before its `contentDescription`, and still matches a caption hidden from the screen reader. Maestro's own `text` selector matches the `contentDescription` too, so a label there on the node that Maestro would find is no gap. Two nodes meet this: the estimate's *Label* field, which has a placeholder, and Today's tally, a text whose label differs from what it shows. Each was confirmed on the node by a uiautomator dump. For those, the flow selects by the placeholder or the shown text, says why in a comment, and the screen test keeps the label pinned. A label missing from the node is still a gap, and the fix is still the label. (How a form field carries its label on Android is #125's.)

**Every flow starts from a fresh install** (`launchApp` with `clearState`), through `e2e/steps/start.yaml`, which loads this checkout's bundle by its development-client link and dismisses the dev menu's introduction. A flow builds its data through the app, never by SQL. Flows are independent, and run in any order. Nor do they depend on the hour: a flow that logs and reads Today back would find a new, empty day if midnight fell between, so the start step holds every flow out of a day's last five minutes, by the machine's clock, which the emulator shares once a moved clock is put back. Five minutes is the longest flow (about 50 s) and the start step's own waits (90 s at most), with room: a flow that grows past it moves the bound.

**A flow changes only with the behaviour it checks, in the same pull request, and is never loosened to pass**: no `optional:`, no dropped assertion. A flaky flow is fixed by waiting for a thing, never retried away, so the verify step passes no `--retries`. **Deleting a flow is the user's**, as deleting a test or a lint rule is.

## Why

- **The swipe to delete had no test, and could not be written.** Probity rightly refused a gesture's behaviour with no failing test, and React Native's renderer cannot make the gesture. A flow that swipes and fails is that test.
- **A measurement is spent once.** The device-only measurements of ADR 0001 proved a change in the session that made it and were never run again. A flow is that measurement kept.
- **The happy paths were walked by hand at each verify.** Written down, they run in minutes and the same way each time, and the agent's walk goes to what is new.

## Alternatives rejected

- **In CI on every pull request.** GitHub's Ubuntu runners would need an Android emulator in the job and a development build, slow and flaky; iOS cannot run there at all. EAS Workflows can run Maestro on an iOS simulator, a paid build per run, and is left for later.
- **At the epic's walk alone.** The swipe needs its red now, in the issue that writes it.
- **Maestro's own CLI.** Exact conformance, at the cost of Java and a second driver of the same emulator beside the one ADR 0004 chose. agent-device's declared divergences (it asserts as soon as the screen matches, where Maestro waits for it to settle; a horizontal swipe is not iOS's back gesture) make a flow stricter here, not looser.
- **agent-device's own `.ad` replay scripts.** Its format alone, which nothing else reads.
- **One long flow over seeded data.** Faster, but one failure hides every step after it.
- **Advisory flows.** A net nobody has to obey rots.

## Consequences

- ADR 0001 no longer says there is no Maestro suite, and its device-only list is driven by a failing flow rather than a one-off command. ADR 0004's emulator walk keeps exploring per change; the suite is the regression net beside Jest.
- `probity.config.ts` has a flow rule beside its pixel and device rules: a failing flow is the observed failing test for behaviour Jest cannot drive. The device rule's one-off command still stands for focus, the keyboard, presentation and scroll until each has its flow.
- `verify` runs the suite before the acceptance criteria are walked, and its pass is evidence for `charters.mjs`.
