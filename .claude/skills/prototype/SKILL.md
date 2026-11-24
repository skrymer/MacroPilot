---
name: prototype
description: Builds a throwaway design prototype as a screen inside the app (app/prototype/), reached from a development-only link on the design page and judged on the phone through Metro, then retires it once its verdict is recorded. Covers when to build one, NOTES.md, the floating variant bar, fake data, the probity and Stryker exemption, and teardown. Use when a new feature needs a screen, when an existing screen is to change, when the user asks for a prototype, mock-up or variants, or when a prototype's verdict is in and it should be retired. Not for a screen being ported from the reference app, which is compared with it instead.
---

# Prototype

A prototype answers one design question by putting candidate screens on the real phone, where the design is actually read, at size and in both appearances. It is never an HTML page or a canvas. It is throwaway by contract: no tests, deleted once answered, the winner rewritten test-first in its real home, never promoted.

## When

- **A new feature's screen, or a change to a screen that exists.** There is no reference to compare with, so a person has to choose.
- **Not a screen being ported.** The reference app already answers what it says and in what order; its look is the design system's.
- **After `/grill-with-docs` has answered every question it can, and before `/to-issues`.** The questions left open *because they need the phone* (layout, hierarchy, wording at size) are what it is for: name them in NOTES.md. The verdict is in before an issue is built, so no issue waits on a person.
- One prototype per question. A new question is a new file under `app/prototype/`.

## Build

1. **Exempt it:** `.claude/skills/prototype/scripts/exempt.sh on`. That adds `!app/prototype/**` to `probity.config.ts` and `stryker.config.mjs`. Lint still applies: a prototype is held to the design rules (`platform-conventions`) like any screen, so what it shows is buildable.
2. **The screen:** `app/prototype/<question>.tsx`, a default-exported Expo Router screen. Reuse the real components (`Text`, `Input`, `Link`, …) and domain functions where they already exist, so the prototype looks like the app, not a sketch of it.
3. **Fake data, inline.** Hard-code the foods, days and figures in the file. Never read a store or the clock. Make the figures plausible for a real day's eating, never lorem or round placeholders.
4. **A floating bar** at the top cycles what is being judged: the variant (`A`/`B`/`C`) and each state worth seeing (*empty day*, *over target*, *unknown protein*, …). Each control is a 44pt target. Accept `?variant=` as a route param, so `macropilot://prototype/<question>?variant=B` opens a variant from the browser.
5. **The link:** add to `app/design.tsx`, inside `__DEV__ ? … : null`, a `Link` named `<Question> prototype` to `/prototype/<question>`. The design page is outside probity, so the link needs no test.
6. **NOTES.md** in `app/prototype/`, one section per prototype (shape below).
7. Commit with the grilling's `CONTEXT.md`/ADR changes (*Grill …: …, and the … prototype*), then hand it over: the user opens `macropilot://design` › the link on the phone. Check `debug`'s `metro.sh` notes first (the port may be another session's), and restart Metro with `--clear` when the prototype uses a class new to the codebase.

### NOTES.md section

```md
# PROTOTYPE — <the question, in a few words> (throwaway)

**Question:** what the user must decide, and what is not in question.
**Run:** design page › **<Question> prototype**, or `macropilot://prototype/<question>?variant=A` (`A` | `B`).
**Variants:** **A — <name>.** what differs. **B — …**
**The floating bar:** each control and the states it cycles.
**Settled while grilling:** what the prototype takes as given, with the CONTEXT.md terms and ADRs it rests on.
**Verdict (<date>):** left empty until the user decides.
**Teardown:** the files and links to delete.
```

## Verdict and retirement

1. Record the verdict in NOTES.md, then where it binds: `DESIGN.md` for the look, `CONTEXT.md` for wording and terms, an ADR if it passes the three tests.
2. Build the winner test-first (`/tdd`, `rn-dev`) in its real screen. Lift nothing from the prototype file.
3. Retire it in its own commit (*Retire the <question> prototype*): delete its file and its NOTES.md section, its link in `app/design.tsx`, and, when `app/prototype/` is left empty, the directory and the exemption (`exempt.sh off`). A teardown that leaves `app/prototype/` empty with the negation still in place is the defect to check for: `exempt.sh status`.
