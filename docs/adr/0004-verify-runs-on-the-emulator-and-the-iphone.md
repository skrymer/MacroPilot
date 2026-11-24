# /verify runs on the Android emulator and the iPhone, and every probe names its source

The app ships on iOS and Android. The development machine runs Linux: it has no iOS Simulator, and builds Android locally and runs its emulator. So Android is both a platform we owe and the only place an automated, native, on-device check can run here.

## The decision

| Source | Carries | Never carries |
| --- | --- | --- |
| **The Android emulator, driven by the agent** with [agent-device](https://incubator.callstack.com/agent-device/docs/introduction) | Flows through shared components; persistence across a kill; absences; layout in both appearances; day boundaries, by moving the emulator's clock and zone; Android's own back, keyboard and font scaling | Any claim about iOS |
| **The iPhone, by hand**, on an EAS dev build | What iOS does its own way: text input and the keyboard, the life cycle, permissions, the camera, and system UI (tab bar, sheets, safe areas, haptics, VoiceOver) | |

**The split is shared versus platform-specific, not styling versus function.** A field that flickers as its user types, or a *Save* that needs two taps because the keyboard took the first, is a functional bug that only one platform's text field produces. The emulator passes both.

**`/verify` is per change, not a regression suite.** Jest is the regression net. It answers two questions: is each acceptance criterion covered by evidence from the source that owns it (an uncovered one is a FAIL), and what breaks it when a tester explores past the criteria. A break found becomes a failing Jest test before it is fixed.

**Every claim carries a screenshot.** There are no scripted flows, so a verdict is an account of what was seen. Screenshots are evidence, never compared against approved ones.

**Probes are independent.** Each starts from its own state: `adb shell pm clear` gives a fresh install in about a second. Probes select by accessibility label, never by coordinates; a control that cannot be found by label is an accessibility gap, and the fix is the label.

## Consequences

- Stryker at `concurrency: 8` takes about 16 GB and the emulator about 4. With the emulator up, Stryker runs at `--concurrency 4`.
- A camera or a haptic on the emulator is not evidence for a real phone.
