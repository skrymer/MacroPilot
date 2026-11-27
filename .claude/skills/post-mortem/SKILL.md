---
name: post-mortem
description: Turns what a finished piece of work cost into changes to the process. A fresh read-only agent mines the session's transcripts for lessons, each with evidence and one home, and the lessons are applied to the skills, hooks, scripts, ADRs or memory. Use as the step after verify in feature-sign-off, when an epic has been tested by the user, or when the user says "post mortem", "retro", or "what did we learn".
---

# Post-mortem

Every run pays for lessons. Left in the conversation they die with it. This routes each into the file the next session will read it from.

## Workflow

1. **Digest the session:**

   ```bash
   node .claude/skills/post-mortem/scripts/digest.mjs [<session-id>] > <scratchpad>/digest.txt
   ```

   The newest session of this checkout, unless one is named: user turns, errors and hook refusals, each with its transcript and line, and the same for every agent it spawned.

2. **Spawn the miner** (`subagent_type: post-mortem-miner`), every slot filled:

   ```
   Repo: <absolute path>
   The change: cd <path> && git diff <base>..<head>
   The issue: gh issue view <n> --comments
   Digest: <absolute path to digest.txt>
   Gate reports: <each gate's report, as it was reported>
   Memory index: <absolute path to MEMORY.md>
   ```

   Never mine it in this conversation, and add no view of what went wrong. While another session works in this checkout, tell the miner to use Read alone: the Bash guard rolls that session's edits back as if the miner's command wrote them.

3. **Apply what it proposes, or say why not.** On its own branch and pull request (`post-mortem-<n>`), never the feature's: a changed file voids the results verify just recorded. Use `write-a-skill` for a skill. A new test, rule or script is test-first.

4. **Prove a mechanical lesson**: the test, rule or script has to fail on the thing that went wrong. A lesson applied but not shown to bite is prose.

5. **Report**: one line a lesson, with its evidence, its home, and applied or not.

## What it may change

| Change | May be merged |
| --- | --- |
| A trap, a correction or a sharper rule in a skill, agent or script; a new test or lint rule; memory | When CI is green |
| **Anything that loosens**: a gate dropped or weakened, a threshold, an exemption, a hook, a permission | Only with the user's word |
| CLAUDE.md's workflow, an ADR's decision, what the user is asked to do | Only with the user's word |

A lesson the user gave is already decided: write it down.

## On an epic

Run it once the user has tested. Its evidence is the epic's post-mortem pull requests and the user's findings. Two questions: **which lesson came up more than once** (it goes to a test, script or hook now), and **which gate let through what the user found**.
