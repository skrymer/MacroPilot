# An issue is verified on the Android emulator by the agent, and an epic on the iPhone by the user

The app ships on iOS and Android. The development machine runs Linux: it has no iOS Simulator, and builds Android locally and runs its emulator. So the emulator is the only place an automated, native, on-device check can run here, and anything on an iPhone needs a person. Asking that person to check every issue makes them the bottleneck of every merge, so their time is spent once per epic, on what only they can see.

## The decision

| Level | Who | What | Result |
| --- | --- | --- | --- |
| **Issue** | The agent, on the Android emulator | A walk-through of the acceptance criteria, then a comparison with the running reference app, then a break-it tester exploring beyond the criteria. No iPhone and no user | The pull request merges to `main` when CI is green |
| **Epic** (a PRD) | The agent on the emulator, then the user on the iPhone | The agent walks the epic whole, including flows that cross issues, and the break-it tester explores its whole diff. The user then runs its happy paths by hand on iOS from a fresh install, and looks at their styling, from a short written script on an EAS dev build | Findings become issues in the same epic. It closes when the user passes it |

**The epic blocks, the issue does not.** The next epic may be grilled and its issues written while the user tests, but building it starts only once the current one has passed, so an iOS-only fault does not spread. Epics are kept to around five to eight issues, because that fault is found at their end.

**What the emulator cannot prove is listed, never dropped.** Each issue records it under *Needs a phone*: iOS's text input and keyboard, VoiceOver, the life cycle, the camera, notifications, haptics, system UI. They stay on the epic's record, and the user's script names what of them it leaves out. An acceptance criterion the emulator cannot show is covered by a named Jest test or put on the list.

**The user's script is the happy paths, and their styling.** From a fresh install, the user runs through what the epic lets them do, each feature once and the way it is meant to be used, and looks at every screen on the way: in light and dark, at the default text and the largest, with the keyboard up and the iOS sheets showing. The logic is the same code on both platforms and its edge cases were verified on the emulator, so they are not tested by hand: a real midnight, a clock set back, a failure or a race cannot be made on a phone, and nothing in them is iOS's own. What an iPhone shows that the emulator cannot is how the app is drawn there. The script is short enough to run in about ten minutes. (Decided by the user on 26 November 2026, at the end of epic 1, whose first script was built from the *Needs a phone* lists and asked for a real midnight.)

**One iOS build per epic.** Its native packages are chosen while it is grilled and added in its first issue.

### On the emulator

**The agent drives the app with [agent-device](https://incubator.callstack.com/agent-device/docs/introduction)**, reading the screen as an accessibility snapshot. It was chosen over Maestro because it is built for an agent exploring, where Maestro runs flows someone wrote. It is a dev dependency at an exact version, and its own `agent-device` skill is copied unchanged from that version's tag, because the skills and docs on its main branch describe commands a released version may not have. What it cannot know about this app is in `drive-emulator`.

**Two minds.** The walk-through and the comparison ask whether what was meant is there, with evidence. The break-it tester asks what nobody asked about, in a fresh context that never sees what passed, because a pass you know about is a place you stop looking. **It runs on every issue and again on every epic.** On an issue it finds a fault while the change is small and not yet merged. On an epic it finds the faults between issues, such as a food corrected on one screen and logged on another, which no issue's diff holds.

**What is ported is compared with what it is ported from.** The criteria are written from the reference app and can misstate it, and the tests' expected figures are worked out by whoever writes the code, so every gate can pass on a rule that differs. The same inputs therefore go to the reference app's running backend and screens and to this one, unrounded where they are figures, and each difference is agreed, out of scope, fixed, or put to the user. Reading its source was the only comparison before, and nothing required it. It ends when the port is complete, since after that the two are free to part.

**The walk is per change, not a regression suite.** Jest is the regression net, with the Maestro flows of [`0011`](./0011-happy-paths-and-what-jest-cannot-drive-are-maestro-flows.md) beside it for the happy paths and what Jest cannot drive, run by agent-device at every verify before the walk, and a break found becomes a failing Jest test before it is fixed, or a measured one when only the pixels can show it ([`0001`](./0001-a-unit-owes-its-own-test-when-it-owns-something.md)).

**Every claim carries evidence, and every probe starts from its own stated state.** The evidence is the accessibility snapshot of the screen, saved to a file. It settles which screen is showing, what it says, what is selected and where back goes, and it is text, so a command can assert on it. **Where the pixels decide, the evidence is a screenshot that has been looked at**: colour, the appearance, clipping, text and display sizes, the photos `sizes.sh` takes, and a figure, because the tree has read "0 kcal" while the screen showed "0". A tab bar drawn in the wrong appearance has a perfect snapshot. Screenshots are never compared against approved ones. Probes select by accessibility label: a control that cannot be found by label is an accessibility gap, and the fix is the label. The one exception, a label on the node that agent-device names by its text or hint instead, is ADR 0011's.

## Alternatives rejected

- **The iPhone on every issue.** It finds iOS faults sooner, and makes a person the gate on every merge.
- **The iPhone never.** A field that flickers as its user types, or a *Save* that needs two taps because the keyboard took the first, is a fault only one platform's text field produces. The emulator passes both.
- **The user's script built from the *Needs a phone* lists.** It aims the user at what only an iPhone can show, and it asks for what a person cannot do by hand (a real midnight, a night asleep, a sheet interrupted) or checks logic the emulator already proved. It also leaves the ordinary use of the app unwalked on iOS.
- **A screenshot for every claim.** Where the claim is about navigation it proves nothing a snapshot does not, and it has to be looked at, where a snapshot is text a command can assert on.
- **A snapshot for every claim.** It cannot see colour, clipping or a figure the screen draws differently from the tree.
- **One agent for both parts.** It explores where it already looked.
- **The break-it tester on the epic alone.** Cheaper, but its findings arrive after the code has merged.

## Consequences

- An iOS-only bug lives until the end of its epic.
- iOS behaviour off the happy paths (VoiceOver, the life cycle, an interrupted sheet) is tested by nobody until a fault is met. The *Needs a phone* lists say where to look then.
- An agent merges to `main` without the user, so CI and the gates are what stands between a change and the epic.
- Stryker at `concurrency: 8` takes about 16 GB and the emulator about 4. With the emulator up, Stryker runs at `--concurrency 4`.
- The emulator draws Android. A pass there says nothing about iOS.
