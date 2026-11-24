---
name: verify
description: The runtime gate. Gives every acceptance criterion evidence from the running app on the Android emulator (driven by the agent) and the iPhone (by hand), then explores for what breaks it, and emits a verdict with screenshots. Use when a change is functionally complete and needs runtime evidence, when the user says "verify this", "walk it through" or "does it actually work", or as the last gate of feature-sign-off.
---

# Verify

Runtime evidence that a change works. Tests already ran. Which source carries what is [`0004`](../../../docs/adr/0004-verify-runs-on-the-emulator-and-the-iphone.md); every probe names its source. It runs last, after the four code gates, so what was verified is what ships.

## Before the first probe

1. Start Metro with the `debug` skill.
2. Emulator: boot it, install the dev build (`npm run android`), drive it with agent-device through `npx`. Confirm the CLI's commands from its `--help`; do not guess them.
3. **Confirm the device fetched the bundle**: Metro's log shows a fresh `Bundled` line for that platform after the latest edit. Without it every probe tests old code. Force-quit, reopen, check again.
4. A schema change needs a reinstall: an install over the app keeps its database.

## Part 1: the acceptance criteria

List the issue's criteria and give each evidence from the source that owns it. **A criterion with no evidence is a FAIL**, however much else passed.

## Part 2: what breaks it

Explore as a tester would: values at and past each boundary, garbage input, double taps, a kill mid-action, back mid-flow, a refused permission, no network. Always, for a screen the change touched:

- **Unknowns.** A fresh install, an empty day, a food with a missing figure. A number or a dash there is a FAIL; so is a known zero that is hidden.
- **The day.** An Entry just before and after local midnight, with the emulator outside UTC.
- **Both appearances**, and **the largest text size**: figures hold, text stops at double, nothing clips.
- **Persistence.** Kill and reopen.

A break becomes a failing Jest test before it is fixed.

## Probes

- **Independent.** Each starts from its own stated state: `adb shell pm clear com.skrymer.macropilot` on the emulator.
- **By accessibility label, never coordinates.** A control that cannot be found by label needs a label.
- **On the iPhone a person runs them.** Send one per message and wait for its result. Number the steps, one action each, with the expected screen in the app's own words, starting from scratch.

## Verdict

```
## /verify — <feature/issue>

Build: <sha>, Android emulator API <n>, iPhone dev build <version>
AC1 ✅ emulator   <what was seen> (shot-1.png)
AC2 ⚠️ iPhone     <what was seen> → FAIL
Explored: <what was tried, not only what broke>
Skipped: <probe, and why>

Verdict: FAIL — <the one reason>
```

Say what was observed, not what should happen. Every claim carries a screenshot. Name every skip. A FAIL or BLOCKED stops the sign-off.
