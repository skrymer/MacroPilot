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

## Part 0: the flows

Run the whole suite before anything else ([`0011`](../../../docs/adr/0011-happy-paths-and-what-jest-cannot-drive-are-maestro-flows.md)), unpiped, and save its report as evidence:

```bash
# emulator.sh wakes the screen and sets Metro's reverse. Asleep, the first flow fails at its link;
# without the reverse, the start step waits on the dev menu's Continue and Metro fetches no bundle.
METRO_PORT=8082 .claude/skills/drive-emulator/scripts/emulator.sh
METRO_PORT=8082 npx agent-device test 'e2e/*.yaml' --maestro --platform android -e METRO_PORT=8082 --report-junit <scratchpad>/gates/flows.xml
```

**Every flow passes, or the verify is a FAIL**, whatever else passes. No `--retries`: a flake is a wait that should be on a thing, and is fixed. **A flow that fails and then passes on a re-run is a flake, and the re-run is not a pass for the first**: fix it, or file it with its failing step and diagnostics before verify is stamped (on #88 one was only written into the report, and filed afterwards as #113). A flow that fails because its screen changed on purpose is changed in the same pull request, with the behaviour, and never loosened to pass (no `optional:`, no dropped assertion); deleting one is the user's. **A new happy path, or new behaviour Jest cannot drive (a gesture, what the system draws, how a page is presented, focus and the keyboard, where a page scrolls to, a cold start or a link), has its flow by now**: if it does not, that is a FAIL. A flow selects by accessibility label and starts from `e2e/steps/start.yaml`. Pixels are not a flow's: they are Part 1's.

## Part 1: the acceptance criteria

List the issue's criteria. Give each evidence: the exact expectation checked on the screen, and the snapshot that shows it, saved to a file. Where the pixels decide (colour, appearance, clipping, size, a figure), a screenshot you have looked at ([`0004`](../../../docs/adr/0004-an-issue-is-verified-on-the-emulator-and-an-epic-on-the-iphone.md)). **A criterion with no evidence is a FAIL**, however much else passed. When one criterion names a path (the background, both directions, another tab), every criterion is driven on it. Until `charters.mjs check` passes, report criteria as measured and never the issue as fixed. For a screen the change touched, always:

- **What is Not stated, and the empty states.** A fresh install, an empty day, a food with a missing figure, each shown as `DESIGN.md`'s *Figures* has it. A number or a dash for what is not stated is a FAIL; so is a known zero that is hidden (an empty day is 0 kcal and 0 g).
- **The default size**: run `drive-emulator`'s `sizes.sh` on its route with `SIZES=default` and look at every photo, at a size it can be read at. A state behind a control (a list opened up, a fault showing) is photographed top to bottom too. Figures hold, nothing clips, no word breaks, no figure is parted from its unit. An issue goes no further, unless it moved text out of `Text` (to the system's header, say): then double is checked here too. Otherwise double is the epic's, and a narrower screen is nobody's ([`0007`](../../../docs/adr/0007-figures-are-fixed-size-and-text-scales-to-double.md)).
- **Every edge of a list** that scrolls, or that says something in a row: a row cut by the top, one cut by the tab bar, the last with the list at its end, and one in the middle that must not move, at the default size, on each page. Again after every change to it: a fix that narrows when something happens drops what the wider rule covered.
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
   - **Out of scope**: micronutrients, accounts, or a later epic's, with its issue. A difference whose fix would bring a later epic's rule in is asked of the user first (`feature-sign-off`, before the gates).
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
3. Run `sizes.sh` whole, on every route the epic has, and look at every photo: text stops at double, figures hold, nothing clips, no word breaks, no figure is parted from its unit, and every control is in reach. A list's edges are measured again at double, and so is a form with the real keyboard up and a fault showing.
4. Run `/break-it` on the PRD, over the epic's whole diff. Settle its findings before the user is asked for anything.
5. Read the epic's list of differences against what was just run. Every row is still true, and none is left *not compared*.
6. Write the user's script for iOS: **the epic's happy paths, and their styling** ([`0004`](../../../docs/adr/0004-an-issue-is-verified-on-the-emulator-and-an-epic-on-the-iphone.md)). From a fresh install, each feature the epic adds used once the way it is meant, in an order that builds a real day; then its screens in dark and at the largest text. Numbered steps, one action each, the expected screen in the app's own words and figures worked out by the app's own domain code, about ten minutes. No edge case (a real midnight, the clock, a failure, a race): those were verified here. If a native package was added, it starts with the EAS build to run. It names what of the issues' and the tester's *Needs a phone* lists it leaves out, links the list of differences and says which rows wait on the user.
7. Post it on the PRD and stop. Each finding becomes an issue in this epic. The user's pass closes it, and `/post-mortem` runs on the epic.
