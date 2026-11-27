---
name: feature-sign-off
description: The pre-commit sign-off gate for a finished feature or fix. Runs five quality gates in order — /simplify, /mutation-test, /code-review, /check-adrs, then /verify on the Android emulator — fixing what each surfaces before moving on, and only then commits and pushes, with a post-mortem after that turns what the run cost into changes to the process. Use when a change is functionally complete and the user says "sign off", "ready to commit", "ready to push", "wrap up this feature", "run the gates", or before opening a PR.
---

# Feature sign-off

The gate a change passes through once it is functionally complete, *before* it is committed. Each gate is a real skill; this one is the conductor.

Run it from a working tree where the behaviour is done **and the suite is green** (`npm test`). It does not replace TDD during the build — it is the exit gate, not a substitute for red-green. Gate 2 in particular assumes a green suite: a failing test makes mutation results meaningless.

## The five gates, in order

Address what each surfaces *before* starting the next. When a gate is done, record it on the code as it stands, on what its run left: write the gate's report to a file (`<scratchpad>/gates/<gate>.md`: the findings and their triage, Stryker's verdicts, the ADR board), then `node .claude/skills/break-it/scripts/charters.mjs gate <issue> <gate> --evidence <file>` (`verify` may give `--photos <dir>` instead). Both are refused when older than the last edit: a gate whose code changed runs again and writes a new report. A later fix drops the stamps of the gates before it, and `charters.mjs gates <issue>` names each one to run again. **A fix to prose alone** (a skill, a `.md`), touching no code and no test: `mutation-test`'s stamp stands, since Stryker reads neither; the other gates are re-read by hand over that delta, and each report gets a section naming the files it changed and what the reading found, then is stamped again (the user's word, 27 November 2026, after #88's three Stryker runs over unchanged code). A delta that touches code or a test runs each gate again in full.

1. **`/simplify` — clean it up.** Apply reuse, simplification, efficiency and altitude cleanups to the changed code. It *edits* the tree, so run it before the bug hunt — the reviewer then reads the code you are actually shipping. Re-run the tests after.

2. **`/mutation-test` — would the tests notice a bug?** Stryker **scoped to the source this change touched**, with one of four verdicts per survivor. A **real gap** means writing the missing test red-green at the seam [`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md) assigns — for code that owns nothing, another case in the screen test, not a new standalone one. An untouched scope reports SKIP.

   It runs here for two reasons: after gate 1, because `/simplify` edits the tree and mutating pre-simplify code wastes time on survivors that have moved; before gate 3, because this gate *writes tests* the reviewer should read.

3. **`/code-review medium` — hunt correctness bugs.** Review the now-simplified diff. **Medium, not high**: at medium it focuses on correctness and drops the reuse and simplification angles gate 1 just applied. Triage every finding — fix the genuine ones, and for each you do not fix, say why. No unexplained findings. **A finding answered by what the app is said to do, and not reproduced, goes into the break-it brief as a charter** (on #111, *a link over an open form throws it away* was answered *a form asks first*, undriven; the tester found the blank page, #117). **One reproduced, by a test or on the device, is genuine**: keep its failing test or measurement, reproduce it once more, say who meets it, and leaving it is the user's call. **A finding that asks for a test is checked against [`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md) before it is written**: a unit that owns nothing gets none, and the finding is answered with that reason. **On a repeat run**, after a fix, the reviewer is given the triaged list from `gates/code-review.md` and asked for new findings, or an old one with new evidence (the user's word, 26 November 2026, on #85's post-mortem).

4. **`/check-adrs` — honour the recorded decisions.** Judge the final diff against `docs/adr/` and the language in `CONTEXT.md`. A FAIL is either a code fix or a same-PR doc fix — the user's call, surfaced rather than decided quietly.

5. **`/verify` — does it actually work?** Last, so what was verified is what ships: every gate before it can edit the tree. On the Android emulator, in three parts: the acceptance criteria, then the same inputs in the running reference app's backend and screens, then `/break-it` beyond them ([`0004`](../../../docs/adr/0004-an-issue-is-verified-on-the-emulator-and-an-epic-on-the-iphone.md)). The user is not part of it. What the emulator cannot show goes on the issue's *Needs a phone* list. A change no screen can show may `SKIP` with a named reason. A FAIL stops the sign-off; its fix goes back through the gates it touches first.

6. **`/post-mortem` — what should the next session not have to learn again?** After the gates, a fresh agent mines the transcripts and each lesson goes into the one file it would have been read from, on a branch of its own. It judges the process and never this change, so it does not hold the merge. "Nothing worth recording" is a result.

## What this repo's gates bite on

- **What is Not stated shown as a figure.** A food with no protein figure is not 0 g; how each case is shown is `DESIGN.md`'s *Figures* (an empty day is 0 kcal, which is known). `/verify` and the screen test's sibling case.
- **A dash standing in for an unknown.** A dash reads as zero. FAIL, not a nitpick.
- **A known zero hidden as if unknown.** The other direction of the same trap: 0 g of protein is a fact. Stryker has no truthiness mutator, so the explicit zero case is caught by discipline.
- **A day decided in UTC**, or by adding 24 hours across a summer-time change. `/code-review` and `/mutation-test`; a test puts the phone outside UTC.
- **Rounding in more than one place.** A total of rounded figures and a rounded total disagree, and both look right. `/code-review`.
- **Domain logic that crept into a screen.** `/check-adrs`. The ESLint rule catches the import but not a total derived inline from props.
- **A colour that is right in one appearance.** `/verify` walks both.

## After the gates

Only once the five gates are green, or every non-green item is fixed or explicitly justified:

1. `node .claude/skills/break-it/scripts/charters.mjs gates <issue>` passes, on its own and before anything is written about the gates. Re-run the suite if any gate changed code: `npm run lint && npm run typecheck && npm test`.
2. **Commit on a feature branch, never straight to `main`.** Group commits by concern.
3. **Push the branch and open a PR.** Its body names only the gates `charters.mjs gates` printed as `ok`, and carries the *Needs a phone* list.
4. **Merge when CI is green**, without asking. Right after `gh pr create`, `gh pr checks --watch` exits non-zero with *no checks reported*: poll `gh pr checks <pr>` until it lists a check, then watch, and call it red only when its output names a failed check. When it was the epic's last issue, `/verify` the epic.

## Reporting

```
## Feature sign-off — <feature/issue>

1. /simplify      ✅ 1 cleanup (consolidated the portion formatter)
2. /mutation-test ⚠️ 38/44 killed. 6 survivors → 1 real gap (test written), 4 equivalent, 1 out-of-scope (/verify)
3. /code-review   ⚠️ 2 findings → both fixed; 1 by-design
4. /check-adrs    ✅ no conflicts
5. /verify        ⚠️ 5/5 ACs; parity 120 compared, 2 agreed differences; 4 charters, 1 fail (double tap logged twice) → fixed, re-verified ✅
6. /post-mortem  ✅ 2 lessons: one into drive-emulator, one a lint rule (PR #n)

Needs a phone: the decimal keyboard on iOS; VoiceOver on the grams field

Suite green. Committed and pushed to <branch>.
```

## Notes

- **Order is load-bearing**: each gate reads what the one before it changed, and verify is last so what was verified ships. `charters.mjs gates` holds it.
- **`/simplify` and `/code-review medium` are complementary.** Simplify owns cleanup and *applies* it; code-review owns the correctness hunt and *reports* it. They only overlap if you run code-review high.
- **Don't rubber-stamp.** A gate that found nothing is a result worth stating; a gate skipped is a gap. Name any skip and why.
- **Fix-or-justify is the bar.** An unaddressed finding means the sign-off is not done.

## Related

- `verify` · `mutation-test` — the two gates with repo-specific skills
- `debug` — the Metro `/verify` runs on
- `tdd` — what should have happened during the build
- [`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md) — the ground gate 2's verdicts stand on
