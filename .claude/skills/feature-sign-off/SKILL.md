---
name: feature-sign-off
description: The pre-commit sign-off gate for a finished feature or fix. Runs five quality gates in order — /simplify, /mutation-test, /code-review, /check-adrs, then /verify on the Android emulator — fixing what each surfaces before moving on, and only then commits and pushes, with a post-mortem after that turns what the run cost into changes to the process. Use when a change is functionally complete and the user says "sign off", "ready to commit", "ready to push", "wrap up this feature", "run the gates", or before opening a PR.
---

# Feature sign-off

The gate a change passes through once it is functionally complete, *before* it is committed. Each gate is a real skill; this one is the conductor.

Run it from a working tree where the behaviour is done **and the suite is green** (`npm test`). It does not replace TDD during the build — it is the exit gate, not a substitute for red-green. Gate 2 in particular assumes a green suite: a failing test makes mutation results meaningless.

## The five gates, in order

Address what each surfaces *before* starting the next. If a later fix changes behaviour, loop back.

1. **`/simplify` — clean it up.** Apply reuse, simplification, efficiency and altitude cleanups to the changed code. It *edits* the tree, so run it before the bug hunt — the reviewer then reads the code you are actually shipping. Re-run the tests after.

2. **`/mutation-test` — would the tests notice a bug?** Stryker **scoped to the source this change touched**, with one of four verdicts per survivor. A **real gap** means writing the missing test red-green at the seam [`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md) assigns — for code that owns nothing, another case in the screen test, not a new standalone one. An untouched scope reports SKIP.

   It runs here for two reasons: after gate 1, because `/simplify` edits the tree and mutating pre-simplify code wastes time on survivors that have moved; before gate 3, because this gate *writes tests* the reviewer should read.

3. **`/code-review medium` — hunt correctness bugs.** Review the now-simplified diff. **Medium, not high**: at medium it focuses on correctness and drops the reuse and simplification angles gate 1 just applied. Triage every finding — fix the genuine ones, and for each you do not fix, say why. No unexplained findings. **One reproduced, by a test or on the device, is genuine**: keep its failing test or measurement, reproduce it once more, say who meets it, and leaving it is the user's call.

4. **`/check-adrs` — honour the recorded decisions.** Judge the final diff against `docs/adr/` and the language in `CONTEXT.md`. A FAIL is either a code fix or a same-PR doc fix — the user's call, surfaced rather than decided quietly.

5. **`/verify` — does it actually work?** Last, so what was verified is what ships: every gate before it can edit the tree. On the Android emulator, in three parts: the acceptance criteria, then the same inputs in the running reference app's backend and screens, then `/break-it` beyond them ([`0004`](../../../docs/adr/0004-an-issue-is-verified-on-the-emulator-and-an-epic-on-the-iphone.md)). The user is not part of it. What the emulator cannot show goes on the issue's *Needs a phone* list. A change no screen can show may `SKIP` with a named reason. A FAIL stops the sign-off; its fix goes back through the gates it touches first.

6. **`/post-mortem` — what should the next session not have to learn again?** After the gates, a fresh agent mines the transcripts and each lesson goes into the one file it would have been read from, on a branch of its own. It judges the process and never this change, so it does not hold the merge. "Nothing worth recording" is a result.

## What this repo's gates bite on

- **An unknown shown as a figure.** An unlogged day is not a day at 0 kcal, and a food with no protein figure is not 0 g. `/verify` and the screen test's sibling case.
- **A dash standing in for an unknown.** A dash reads as zero. FAIL, not a nitpick.
- **A known zero hidden as if unknown.** The other direction of the same trap: 0 g of protein is a fact. Stryker has no truthiness mutator, so the explicit zero case is caught by discipline.
- **A day decided in UTC**, or by adding 24 hours across a summer-time change. `/code-review` and `/mutation-test`; a test puts the phone outside UTC.
- **Rounding in more than one place.** A total of rounded figures and a rounded total disagree, and both look right. `/code-review`.
- **Domain logic that crept into a screen.** `/check-adrs`. The ESLint rule catches the import but not a total derived inline from props.
- **A colour that is right in one appearance.** `/verify` walks both.

## After the gates

Only once the five gates are green, or every non-green item is fixed or explicitly justified:

1. Re-run the suite if any gate changed code: `npm run lint && npm run typecheck && npm test`.
2. **Commit on a feature branch, never straight to `main`.** Group commits by concern.
3. **Push the branch and open a PR.** Its body names the gates that passed and carries the *Needs a phone* list.
4. **Merge when CI is green**, without asking. When it was the epic's last issue, `/verify` the epic.

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

- **Order is load-bearing.** Simplify before mutation-test and review, so both read the shipping code. Mutation-test before review, because it writes tests the reviewer then reads. check-adrs after review, judging the final diff. Verify last, on the device, so what was verified is what ships.
- **`/simplify` and `/code-review medium` are complementary.** Simplify owns cleanup and *applies* it; code-review owns the correctness hunt and *reports* it. They only overlap if you run code-review high.
- **Don't rubber-stamp.** A gate that found nothing is a result worth stating; a gate skipped is a gap. Name any skip and why.
- **Fix-or-justify is the bar.** An unaddressed finding means the sign-off is not done.

## Related

- `verify` · `mutation-test` — the two gates with repo-specific skills
- `debug` — the Metro `/verify` runs on
- `tdd` — what should have happened during the build
- [`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md) — the ground gate 2's verdicts stand on
