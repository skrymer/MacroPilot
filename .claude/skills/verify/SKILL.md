---
name: verify
description: The runtime gate, on the Android emulator. Gives every acceptance criterion of an issue evidence from the running app, then has a break-it tester explore beyond them, and emits a verdict with screenshots. For an epic, walks it whole, runs the break-it tester over all of it and writes the user's iPhone script. Use when a change is functionally complete and needs runtime evidence, when the user says "verify this", "walk it through" or "does it actually work", as the last gate of feature-sign-off, or when an epic's last issue has merged.
---

# Verify

Runtime evidence that a change works. Tests already ran. Who verifies what is [`0004`](../../../docs/adr/0004-an-issue-is-verified-on-the-emulator-and-an-epic-on-the-iphone.md): an issue is the agent's, on the emulator, and **never asks the user for anything**. It runs last, after the four code gates, so what was verified is what ships.

## Before the first probe

1. Start Metro with the `debug` skill.
2. `.claude/skills/break-it/scripts/emulator.sh` boots the emulator and prints its serial. Drive it as [driving.md](../break-it/references/driving.md) says.
3. **Confirm the device fetched the bundle**: Metro's log shows a fresh `Android Bundled` line after the latest edit. Without it every probe tests old code.
4. A schema change needs `clear-app-state`, or the old database stays.

## Part 1: the acceptance criteria

List the issue's criteria. Give each evidence: the exact expectation checked on the screen, and a screenshot you have looked at. **A criterion with no evidence is a FAIL**, however much else passed. For a screen the change touched, always:

- **Unknowns.** A fresh install, an empty day, a food with a missing figure. A number or a dash there is a FAIL; so is a known zero that is hidden.
- **Both appearances**, and **the largest text size**: figures hold, text stops at double, nothing clips.
- **Persistence.** Kill and reopen.

A criterion the emulator cannot show names the Jest test that covers it, or goes under *Needs a phone*.

## Part 2: what breaks it

Run `/break-it`. Never explore in this conversation: the tester must not know what passed.

## Verdict

```
## /verify — <issue>

Build: <sha>, Android emulator API <n>
AC1 ✅ <what was seen> (shot-1.png)
AC2 ❌ <what was seen> (shot-2.png)
Charters: <as check printed them>
Needs a phone: <what iOS or real hardware could still break, one line each>
Skipped: <probe, and why>

Verdict: FAIL — <the one reason>
```

Say what was observed, not what should happen. Name every skip. A FAIL or BLOCKED stops the sign-off.

## An epic

When a PRD's last issue has merged:

1. Walk the PRD's user stories end to end on the emulator, on `main`, from a fresh install. Cross the issues: what one wrote, read on another's screen.
2. Run `/break-it` on the PRD, over the epic's whole diff. Settle its findings before the user is asked for anything.
3. Merge the issues' *Needs a phone* lists, and the epic tester's, into one script for the user to run on iOS: numbered steps, one action each, the expected screen in the app's own words, from a fresh install, ten minutes at most. If a native package was added, it starts with the EAS build to run.
4. Post it on the PRD and stop. Each finding becomes an issue in this epic. The user's pass closes it.
