---
name: break-it
description: Sends a fresh break-it tester at a change on the Android emulator, to explore beyond its acceptance criteria through charters derived from the diff, each recorded with a result and its evidence. Use as part two of verify on an issue, again on an epic's whole diff, or when the user says "break it", "try to break this", "explore this", or "exploratory test".
---

# Break it

`verify` checks what the issue asked for. This checks what nobody asked about. A **fresh** `break-it-tester` agent does it: never explore in this conversation, and never hand the tester the walk-through's results, so it doesn't anchor on what passed.

Run `s=.claude/skills/break-it/scripts` and `e=.claude/skills/drive-emulator/scripts` from the repo root.

| Command | Does |
| --- | --- |
| `$e/emulator.sh` | Boots the emulator if none runs, checks the app is installed and Metro answers, and prints the serial. Stops, saying what is missing, rather than carry on |
| `node $s/charters.mjs head <issue>` | Stamps the code and measures the change, drops rows recorded on other code, prints the results and evidence directory |
| `node $s/charters.mjs charter <issue> "<charter>"` | Registers a charter, prints its key. A fifth is refused while the app's lines in the change, its tests aside, are 100 or fewer |
| `node $s/charters.mjs record <key> <status> --snapshot <file> --note "<text>"` | Records a result. `--screenshot <file>` too, or instead, where the pixels decide ([`0004`](../../../docs/adr/0004-an-issue-is-verified-on-the-emulator-and-an-epic-on-the-iphone.md)). Refused once the code has changed |
| `node $s/charters.mjs check <issue>` | Fails on no charter, or on one with no result |

## Workflow

1. **Device and code.** `$e/emulator.sh`, then `node $s/charters.mjs head <issue>`. Note the serial and the directory. Don't change code from here until `check` passes.
2. **Spawn the tester** (`subagent_type: break-it-tester`) with this brief, every slot filled:

   ```
   Repo: <absolute path> (<a git worktree | the main checkout>; stay in it).
   The change: cd <path> && git diff <merge-base with origin/main>
   What it does: <one or two sentences in the code's own terms; description, never assessment>
   The issue: gh issue view <n> --comments
   Charters: node <absolute path to charters.mjs>; run from the repo root
   Evidence: <the directory head printed>
   Already filed: <each open bug near the change, number and one line, so it is not charted again>
   Emulator: <serial>
   Driving: <absolute paths to the agent-device and drive-emulator SKILL.md>
   Heuristics: <absolute path to references/heuristics.md>; inputs: <absolute path to references/inputs.md>
   ```

   Its contract is in its definition. Add nothing that says what passed, and no time limit. If it is slow, read its charters and send it where the risk is. Settle here, on the emulator, whether the diff caused what it found.
3. **Check:** `node $s/charters.mjs check <issue>`. When it fails, send the tester back to what it names.
4. **Report** each charter's result as `check` printed it, then the tester's findings in its own words.

## On an epic

The same workflow, with the PRD's number for `<issue>`, on `main`. The change is `git diff <the commit before the epic's first merge>`, and that commit is `head`'s `--base`, or the epic measures as nothing. Tell the tester to charter what crosses issues: what one wrote, read, corrected or deleted from another's screen.

## What a finding is

A `fail` is not yours to dismiss. Before one becomes a criterion or is fixed, say which screen of a release build shows it. If none does, or it proves intermittent, put its size to the user first. Each one is a bug in the diff, or behaviour nothing defines. A bug becomes a failing Jest test before it is fixed, or a measured fault when only the pixels can show it ([`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md)), and the fix goes back through the gates it touches. Undefined behaviour is settled against what the app this is built from does, when the user has named one; otherwise it becomes an issue and goes to the user with the epic, not in the middle of the issue. On an epic, findings are settled before the user's test on iOS.

*Needs a phone* items go on the epic's list for the user's test.

One tester at a time per emulator: two would fight over one screen.
