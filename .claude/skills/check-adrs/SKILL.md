---
name: check-adrs
description: Judges a change against this repo's recorded decisions — the ADRs in docs/adr/ and the ubiquitous language in CONTEXT.md. Maps the diff to the decisions it touches, extracts each normative constraint, and emits a per-constraint PASS/FAIL/UNCERTAIN verdict citing both the doc line and the code. Read-and-judge; it changes nothing. Use as gate 4 of feature-sign-off, before opening a PR, or when the user asks to check a change against the ADRs, CONTEXT.md, or the recorded decisions.
---

# Check against recorded decisions

Gate 4 of `feature-sign-off`, judging the diff the code gates leave. `/verify` asks whether it works on the device, `/code-review` asks whether it is correct, and this asks whether it honours what the project already decided. It catches the drift the others miss: a rejected alternative quietly reintroduced, an out-of-scope line crossed, a domain term the code spells its own way.

**This gate reads and judges. It does not edit.** A constraint that genuinely no longer fits is fixed by updating the ADR or `CONTEXT.md` in the same PR — but that is the user's call, surfaced as a finding rather than decided quietly.

## Why this repo needs it

Every trap here produces a **plausible wrong number** rather than an error: an unknown summed as zero, a meal on the wrong day, a portion scaled from the wrong weight. The decision that names the trap is often the only thing standing between the two, because the code looks right.

## Workflow

1. **Get the diff.** `git diff main -- src app` for a pre-commit gate — **two dots, not three**. A three-dot range against an uncommitted tree reports nothing and passes silently.

2. **Map the diff to decisions.** ADR filenames are descriptive; Read `CONTEXT.md` when it exists. Select every decision the change plausibly touches, and say which you ruled out and why. When in doubt, include it.

3. **Extract constraints.** Pull every normative statement as a discrete, checkable claim, quoting the source line:

   | Kind | Looks like |
   | --- | --- |
   | **Decision** | "the rule is", a stated invariant, "chosen" |
   | **Rejected alternative** | "rejected", "we considered X" — must NOT reappear |
   | **MUST / MUST NOT** | "never", "always", "entirely", "exactly" |
   | **Out-of-scope** | "deferred", "does not exist yet" — checked by ABSENCE |
   | **Constant** | an energy factor, a window's length in days — chosen, and recorded with its reason |
   | **Domain term** | a `CONTEXT.md` term; code must spell it exactly |

4. **Check each against the code**, preferring reading it over assuming. A constraint the diff should have implemented and didn't is itself a finding.

   - **PASS** — cite the `file:line` that honours it
   - **FAIL** — cite the offending `file:line` and the doc line it contradicts
   - **UNCERTAIN** — relevant but unconfirmable from the diff; say what would resolve it

5. **Report** FAILs first, then UNCERTAINs, then the PASS summary.

## What bites in this repo

- **An absence collapsed into zero**, in the domain, in SQL (`COALESCE(…, 0)`, a `NOT NULL DEFAULT 0`) or on screen. A dash is the same defect.
- **A day judged outside the `Clock` port and its offset.** `0001`, `0002`.
- **Domain logic in a screen.** `0002`. ESLint catches a forbidden import but not a total derived inline from props.
- **A backend, an owner or an account creeping in.** `0003`. So is a micronutrient.
- **Text moved out of `Text`.** A title the system draws, or text sized some other way, left 0007's cap behind. "It is the system's, not our token" is a FAIL, not a reason: 0007 caps it too.
- **A colour decided in a component.** `0005`: no `dark:`, no hex.
- **A refused term.** `CONTEXT.md` names the synonyms to avoid; one in code is a FAIL even when the code works.

## Report format

```
## ADR / CONTEXT check — <feature/issue>

Reviewed: 0002, 0003, CONTEXT.md
Ruled out: 0005 (no styling touched), 0006 (no dependency change)

### ❌ FAIL (1)
- **[0002] The domain computes.** app/day.tsx:24 sums the protein itself.
  → 0002: "A screen that computes a total is a defect, not a shortcut."

### ⚠️ UNCERTAIN (1)
- **[CONTEXT] An unknown is not zero.** day.tsx:61 renders `format(protein)`, but the
  formatter is not in this diff. Resolve: read it.

### ✅ PASS (1)
- [0002] No react/react-native import under src/domain (eslint clean).
```

## Notes

- **Cite, don't paraphrase.** A FAIL the reviewer cannot trace to a doc line and a code line is noise.
- **Scope is the diff.** Pre-existing violations outside it are an UNCERTAIN footnote at most, never a FAIL.
- **Out-of-scope is checked by absence.** For a deferred ruling, the PASS is *not finding* the code.
- **Don't inflate an UNCERTAIN to a PASS** to get a green board. A gate that found nothing is a result worth stating.

## Related

- `feature-sign-off` — the conductor; this is its fourth gate
- `verify` — runtime behaviour · `/code-review` — correctness
