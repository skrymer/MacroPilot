---
name: mutation-test
description: Runs StrykerJS over the Jest suite, scoped to the source a change touched, then triages every surviving mutant to one of four verdicts. The deliverable is a verdict per survivor, never a score. Use as a gate inside feature-sign-off, or when the user asks to mutation-test a change, run Stryker, measure a mutation score, check whether the tests would actually catch a bug, or find under-asserted tests.
---

# Mutation test

Coverage says a line ran. Mutation testing asks whether any test would have **noticed it change**. Stryker rewrites the source one mutant at a time and re-runs the covering tests; a survivor is a line no assertion pins.

**The deliverable is a verdict per survivor, never a score.** A percentage nobody has read the survivors behind is worth nothing.

## Workflow

Steps 1–3 are these commands. Run them; do not retype what the scripts do.

```bash
s=.claude/skills/mutation-test/scripts
scope=$($s/scope.sh)                                   # fetches, diffs against origin/main
npx stryker run --mutate "$scope" > <scratchpad>/stryker.txt 2>&1   # run_in_background
node $s/survivors.mjs                                  # reads reports/mutation/mutation.json
```

1. **Scope from the diff.** Mutating untouched source reports old debt as if this change caused it, so `scope.sh` names **only the lines the change added or altered** (`file:start-end`, Stryker's line-range syntax) and each untracked file whole, never tests. It diffs against `origin/main`, freshly fetched, because a worktree's local `main` is rarely pulled and diffing against it hands this change everything merged since. It is a two-dot diff, never `...`: the gate runs before the commit, and a three-dot range would report nothing and pass silently. **Empty output → report SKIP**, and say so rather than omitting it.

2. **Run** Stryker over that scope, **with its whole output to a file**, in the background: a scoped run still takes minutes. Never pipe it through `tail` or `head`. The clear-text reporter prints the survivors *above* its score table, so keeping only the end keeps the table and silently drops every survivor; that cost a full rerun once.

3. **List the survivors** with `survivors.mjs`, which reads the JSON report Stryker always writes (`stryker.config.mjs`) and prints every `Survived` and `NoCoverage` mutant with its place, mutator, replacement and source line, then the count of each status. The report is the source; the console is only progress.

4. **Triage every survivor.** Each is exactly one of four:

   - **Real gap** — the mutant changes behaviour someone could observe. Write the missing test red-green: confirm it fails against the mutant's behaviour *before* restoring the source. Write it **at the seam [`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md) assigns**, not wherever is easiest. If the unit owns an invariant, a judgement or a translation, the test is its own; if it owns nothing, the fix is another case in the **screen test** — never a standalone test with mocked collaborators invented to kill the mutant.
   - **Killed by an out-of-scope layer** — the behaviour's red lives in `/verify`. **Name the specific thing that kills it.** With only one automated suite here, this is a narrow verdict: if nothing kills it, that is a real gap in that layer, not an excuse.
   - **Equivalent mutant** — semantically identical, so no test can kill it: `x >= 0` → `x > -1`, a re-ordering with no observable effect. Record it in one line with the reason.
   - **False survivor** — a test does kill it, but the engine never ran that test. Suspect it when a whole module scores 0%, and settle it by hand-mutating the line and running the suite. If tests fail, the verdict is "the tool cannot see it" and no test is owed.

5. **Report** killed-vs-total from `survivors.mjs`' last line, then the verdict on each survivor. State the counts, not just a percentage.

**Never raise a threshold, narrow the scope, or add an exclusion to make a survivor go away.** An exclusion is a claim about a whole class of code and needs the same evidence a verdict does.

## What Stryker cannot see here

Read this before writing off a survivor — the honest answer is *not much*, because there is only one automated suite and it is all in `npm test`.

What genuinely sits outside it:

- **`/verify` — the emulator and the iPhone.** The only thing that observes layout, the keyboard, a kill and relaunch, or a camera.
- **Native config.** Permission strings and plugins live in `app.json` and the generated native project, not in mutable TypeScript.

The consequence: [`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md) defers code that owns nothing to the **screen test**, and Stryker *runs* the screen tests. So a surviving mutant in a screen is **not** excused by "the screen test covers it" — Stryker ran that test and it did not notice. Either the screen test is under-asserted, or the mutant is equivalent.

## Known blind spots

- **No truthiness mutator.** `x == null ? a : b` scoring 100% says nothing about whether `x ? b : a` would be caught, and those differ for `0`, `''` and `NaN`. That matters here more than most codebases: absence is a first-class value and an unknown must never render as a zero, so every guard distinguishing absent from zero needs an explicit zero case the score will never ask for.
- **Configuration is not mutable code.** Any tuning figure that moves into a config file is outside the mutable path by construction, and needs a test asserting the figure the rule produces at its boundary.
- **A `timeout` verdict is not a survivor.** It usually means the mutant produced an infinite loop, and counts as killed.

## Gotchas

Add each one that costs a confusing run, symptom first.

**The run is killed partway, and Metro with it, "because the system is running low on memory"**. With no concurrency set, Stryker starts one Jest runner per core but one, 13 on the 14-core laptop, and each loads the whole jest-expo app project, about 2 GiB: together they filled 30 GiB and pushed into swap. `stryker.config.mjs` now caps it at `concurrency: 8`, about 16 GiB, leaving room for Metro and a browser. Never raise it past that or pass a higher `--concurrency`; if memory is short (another session's Metro or Jest running), pass `--concurrency 4`.

**Test files in the score table, with hundreds of survivors** (`index.test.tsx 59.73`), and a run three times longer than the source alone needs. The scope filter excluded nothing: `grep -v '\.test\.tsx?$'` is a basic regex, where `?` is a literal character, so it matches no filename. It must be `grep -Ev`. Mutating a test file tests nothing; ignore those rows if an old run shows them.

**The scope names files this change never touched** (`goal.ts`, `trend.ts` on a Recipe branch), and the run takes far longer than the diff deserves. The scope was taken against a local `main` behind `origin/main`, so everything merged since counted as this change. `scope.sh` fetches and diffs against `origin/main`; a hand-rolled scope must too.

**`Cannot combine a glob expression with a mutation range in "app/foods/[id].tsx:1-78"`**, and Stryker exits before running anything. An Expo Router dynamic route's brackets are a glob character class to Stryker, and a glob takes no line range. Give the file whole, with each bracket as a `?` wildcard: `app/foods/?id?.tsx`. **Not** `app/foods/\[id\].tsx`: escaping matches nothing, Stryker only warns `Glob pattern … did not result in any files`, and the run reports the other files as if the screen had been mutated. Check the `Found N of … file(s)` line. `scope.sh` now does this itself. Never drop a file from the scope to get a run going. Mutating the file whole also reports its older survivors, and those are verdicted like any others.

**Survivors in `InMemory…Store`, `ScriptedClock` and other test doubles.** `scope.sh` excludes tests by filename, and these are test doubles that live beside the code they stand in for. A survivor in one is not a gap in production code; verdict them as test doubles rather than writing tests for the fake.

**A score table and no survivors**, after a run whose output went through `tail`. The clear-text reporter prints survivors before the table. Read them with `survivors.mjs`, never from the console.

## Related

- [`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md) — which units owe their own test; the ground every verdict stands on
- `tdd` — writing the missing test · `feature-sign-off` — runs this as a gate
- `rn-dev` · `component-testing-best-practices`
