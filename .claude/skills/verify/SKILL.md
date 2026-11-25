---
name: verify
description: The runtime gate, on the Android emulator. Gives every acceptance criterion of an issue evidence from the running app, then has a break-it tester explore beyond them, and emits a verdict with its evidence. For an epic, walks it whole, runs the break-it tester over all of it and writes the user's iPhone script. Use when a change is functionally complete and needs runtime evidence, when the user says "verify this", "walk it through" or "does it actually work", as the last gate of feature-sign-off, or when an epic's last issue has merged.
---

# Verify

Runtime evidence that a change works. Tests already ran. Who verifies what is [`0004`](../../../docs/adr/0004-an-issue-is-verified-on-the-emulator-and-an-epic-on-the-iphone.md): an issue is the agent's, on the emulator, and **never asks the user for anything**. It runs last, after the four code gates, so what was verified is what ships.

## Before the first probe

1. Start Metro with the `debug` skill.
2. Boot and drive the emulator with the `drive-emulator` skill.
3. **Confirm the device fetched the bundle**: Metro's log shows a fresh `Android Bundled` line after the latest edit. Without it every probe tests old code.
4. A schema change needs `clear-app-state`, or the old database stays.

## Part 1: the acceptance criteria

List the issue's criteria. Give each evidence: the exact expectation checked on the screen, and the snapshot that shows it, saved to a file. Where the pixels decide (colour, appearance, clipping, size, a figure), a screenshot you have looked at ([`0004`](../../../docs/adr/0004-an-issue-is-verified-on-the-emulator-and-an-epic-on-the-iphone.md)). **A criterion with no evidence is a FAIL**, however much else passed. When one criterion names a path (the background, both directions, another tab), every criterion is driven on it. Until `charters.mjs check` passes, report criteria as measured and never the issue as fixed. For a screen the change touched, always:

- **Unknowns.** A fresh install, an empty day, a food with a missing figure. A number or a dash there is a FAIL; so is a known zero that is hidden.
- **Every size**: run `drive-emulator`'s `sizes.sh` on its route and look at every photo, at a size it can be read at. A state behind a control (a list opened up, a fault showing) is photographed top to bottom at each size too. Figures hold, text stops at double, nothing clips, no word breaks, no figure is parted from its unit ([`0007`](../../../docs/adr/0007-figures-are-fixed-size-and-text-scales-to-double.md)).
- **Every edge of a list** that scrolls, or that says something in a row: a row cut by the top, one cut by the tab bar, the last with the list at its end, and one in the middle that must not move, at the default size and at the worst, on each page. Again after every change to it: a fix that narrows when something happens drops what the wider rule covered.
- **Both appearances**, the light one at the default size included.
- **Persistence.** Kill and reopen.

A criterion the emulator cannot show names the Jest test that covers it, or goes under *Needs a phone*.

## Part 2: the same as the reference app

This app is a port, so a criterion can pass and still be wrong: the issue may misstate the reference app, or leave something out. What was built is compared with the reference app itself, **its Kotlin backend and its screens both, running**. Reading its code says where to look, and only a run is evidence.

The running copy and its tools are in `~/Development/macropilot-reference`, outside this repo: `up.sh` starts it on `http://localhost:8190` with a database of its own, `seed.mjs` empties and fills that, and `show.sh` prints its source at the commit that is running. Say which commit.

1. **Read both sides** before running either: the Kotlin for each rule the change has (`domain`, `service`, `persistence`, `api`), and the Vue for each screen (the page, its components, and the `utils` that word and round). List every rule, message, order, default and state found there.
2. **The backend.** Send the same inputs to its API and to this app's domain code, and compare **unrounded**: figures, totals, order, what is stored, what is refused. Boundaries, a known zero and a figure not stated are among the inputs. Call this app's own functions, never a formula written again in the script. **Prove the comparison can fail**, against a copy with one rule made wrong. The script stays in that folder, and an input that differs stays in the script: named by its row in the epic's list, counted in the report, and failing once it no longer differs.
3. **The screens.** Do the same actions in its pages and on the emulator, from the same foods and entries: what each input is taken as, every word shown, what is focused, what is listed and in what order, what an empty, failed or refused state says. `compare.mjs <route>` sets the two side by side: open the app on the right screen first, and look at the photo.
4. **Give every difference a verdict.** None is left unlisted:
   - **Agreed**: in the PRD's *Further Notes*, an ADR, `CONTEXT.md` or `DESIGN.md`, cited. The look is Trim's and never a difference.
   - **Out of scope**: micronutrients, accounts, or a later epic's, with its issue.
   - **Wrong here**: fixed, test-first, before the sign-off goes on.
   - **Undecided**: nothing says which is right. It is the user's, and the reference app's behaviour is what ships until they say. Where that behaviour is itself a fault (a figure taken for another), what is here stays, and the list says so.
5. **Record every one on the epic**, in its one comment *Where this differs from the reference app*, edited in place and linked from the epic's body: the user reads it when they test by hand and sign off. Each row says what the reference app does, what this one does, why, who decided and where, and whether it was run or only read. The user's to decide come first. A comment that the epic has not yet is made. An agreed difference is recorded like any other; only the look is left out. A row agreed for one field is not a row for another: each line of the run has one of its own. **A difference not in that list is a FAIL**, and so is one whose words are left out of date by a fix.

Where the Kotlin and its own screen disagree, the Kotlin is the rule. A difference **wrong here**, or a step not run, is a FAIL. When the running copy cannot be started, the verdict is BLOCKED, not a skip. A change with no counterpart there (tooling, a lint rule) says so in a line.

## Part 3: what breaks it

Run `/break-it`. Never explore in this conversation: the tester must not know what passed.

## Verdict

```
## /verify — <issue>

Build: <sha>, Android emulator API <n>
AC1 ✅ <what was seen> (shot-1.png)
AC2 ❌ <what was seen> (shot-2.png)
Parity: <commit>, <n> compared on the backend, <n> actions on the screens; differences: <n> agreed, <n> out of scope, <n> wrong here (fixed), <n> undecided; all <n> in the epic's list (url)
Charters: <as check printed them>
Needs a phone: <what iOS or real hardware could still break, one line each>
Skipped: <probe, and why>

Verdict: FAIL — <the one reason>
```

Say what was observed, not what should happen. Name every skip. A FAIL or BLOCKED stops the sign-off.

## An epic

When a PRD's last issue has merged:

1. Walk the PRD's user stories end to end on the emulator, on `main`, from a fresh install. Cross the issues: what one wrote, read on another's screen.
2. Run Part 2 over the whole epic, on flows that cross its issues: the same day logged in both, compared at its end.
3. Run `/break-it` on the PRD, over the epic's whole diff. Settle its findings before the user is asked for anything.
4. Read the epic's list of differences against what was just run. Every row is still true, and none is left *not compared*.
5. Merge the issues' *Needs a phone* lists, and the epic tester's, into one script for the user to run on iOS: numbered steps, one action each, the expected screen in the app's own words, from a fresh install, ten minutes at most. If a native package was added, it starts with the EAS build to run. The script links the list of differences and says which rows wait on the user.
6. Post it on the PRD and stop. Each finding becomes an issue in this epic. The user's pass closes it, and `/post-mortem` runs on the epic.
