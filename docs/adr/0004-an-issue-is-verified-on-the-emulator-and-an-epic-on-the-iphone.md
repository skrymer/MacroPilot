# An issue is verified on the Android emulator by the agent, and an epic on the iPhone by the user

The app ships on iOS and Android. The development machine runs Linux: it has no iOS Simulator, and builds Android locally and runs its emulator. So the emulator is the only place an automated, native, on-device check can run here, and anything on an iPhone needs a person. Asking that person to check every issue makes them the bottleneck of every merge, so their time is spent once per epic, on what only they can see.

## The decision

| Level | Who | What | Result |
| --- | --- | --- | --- |
| **Issue** | The agent, on the Android emulator | A walk-through of the acceptance criteria, then a break-it tester exploring beyond them. No iPhone and no user | The pull request merges to `main` when CI is green |
| **Epic** (a PRD) | The agent on the emulator, then the user on the iPhone | The agent walks the epic whole, including flows that cross issues, and the break-it tester explores its whole diff. The user then tests it by hand on iOS, from a short written script on an EAS dev build | Findings become issues in the same epic. It closes when the user passes it |

**The epic blocks, the issue does not.** The next epic may be grilled and its issues written while the user tests, but building it starts only once the current one has passed, so an iOS-only fault does not spread. Epics are kept to around five to eight issues, because that fault is found at their end.

**What the emulator cannot prove is listed, never dropped.** Each issue records it under *Needs a phone*: iOS's text input and keyboard, VoiceOver, the life cycle, the camera, notifications, haptics, system UI. The lists make the user's script, so the user tests only what they alone can. An acceptance criterion the emulator cannot show is covered by a named Jest test or put on the list.

**One iOS build per epic.** Its native packages are chosen while it is grilled and added in its first issue.

### On the emulator

**The agent drives the app with [agent-device](https://incubator.callstack.com/agent-device/docs/introduction)**, reading the screen as an accessibility snapshot. It was chosen over Maestro because it is built for an agent exploring, where Maestro runs flows someone wrote. It is a dev dependency at an exact version, and its own `agent-device` skill is copied unchanged from that version's tag, because the skills and docs on its main branch describe commands a released version may not have. What it cannot know about this app is in `drive-emulator`.

**Two parts, two minds.** The walk-through asks whether each criterion has evidence. The break-it tester asks what nobody asked about, in a fresh context that never sees what passed, because a pass you know about is a place you stop looking. **It runs on every issue and again on every epic.** On an issue it finds a fault while the change is small and not yet merged. On an epic it finds the faults between issues, such as a food corrected on one screen and logged on another, which no issue's diff holds.

**It is per change, not a regression suite.** Jest is the regression net, and a break found becomes a failing Jest test before it is fixed.

**Every claim carries a screenshot, and every probe starts from its own stated state.** Screenshots are evidence, never compared against approved ones. Probes select by accessibility label: a control that cannot be found by label is an accessibility gap, and the fix is the label.

## Alternatives rejected

- **The iPhone on every issue.** It finds iOS faults sooner, and makes a person the gate on every merge.
- **The iPhone never.** A field that flickers as its user types, or a *Save* that needs two taps because the keyboard took the first, is a fault only one platform's text field produces. The emulator passes both.
- **One agent for both parts.** It explores where it already looked.
- **The break-it tester on the epic alone.** Cheaper, but its findings arrive after the code has merged.

## Consequences

- An iOS-only bug lives until the end of its epic.
- An agent merges to `main` without the user, so CI and the gates are what stands between a change and the epic.
- Stryker at `concurrency: 8` takes about 16 GB and the emulator about 4. With the emulator up, Stryker runs at `--concurrency 4`.
- The emulator draws Android. A pass there says nothing about iOS.
