# CLAUDE.md

## Project

MacroPilot is a personal macro and calorie tracker for **iOS and Android**. Everything is on the device: no server, no account ([`0003`](./docs/adr/0003-data-and-rules-live-on-the-device.md)). The macros are protein, carbohydrate, fat, fibre and alcohol; vitamins and minerals are out of scope.

`CONTEXT.md` is the ubiquitous language; read it before naming anything. The first `/grill-with-docs` writes it. The decisions the design rests on are in [`docs/adr/`](./docs/adr/). [`DESIGN.md`](./DESIGN.md) is **Trim**, the design system; its live reference is `app/design.tsx`, and if the two disagree the page is wrong.

## Status

**Scaffold only.** Every gate is wired and green. Two tabs, Today (a placeholder) and Developer (development builds only). No domain code, no storage. The EAS project is `@skrymer/macropilot`; its first iOS development build is being made.

## Communication

**Write TL;DR first.** Lead with the answer, the recommendation, or the finding. Then stop.

- **A question is a recommendation plus the ask**, in a line or two.
- **Reasoning belongs in the artifact, not the chat**: the ADR, `CONTEXT.md`, or the issue.
- **No preamble**, no recap of what was just read.
- **Report outcomes plainly.** If something failed, say so with the evidence.

**The exception: committed documents are not terse.** ADRs, specs and issues carry the full reasoning, because a reader who sees only the decision will undo it.

Documents and comments here stand alone: they do not refer to other repositories of the user's.

## Architecture

```
src/domain/      pure TypeScript: no react, react-native or expo, no ports
src/storage/     expo-sqlite adapters behind narrow ports, and their in-memory fakes (none yet)
src/lifecycle/   the Clock port: SystemClock and ScriptedClock
src/components/  shared UI: presents values, judges nothing
app/             Expo Router screens: present values, judge nothing
```

**The domain core computes; the UI presents** ([`0002`](./docs/adr/0002-the-domain-core-is-framework-free.md)).

## How a feature gets built

1. **`/grill-with-docs`**: challenge the plan. New terms and ADRs are written as they crystallise. A plan that survives unchanged was grilled too gently.
   A new feature's screen, or a change to one that exists, then gets a **`/prototype`** the user judges. A screen ported from the reference app does not.
2. **`/to-issues`**: break it into independently grabbable GitHub issues.
3. **`/tdd`** with **`rn-dev`**: one red-green slice at a time.
4. **`/feature-sign-off`**: `/simplify`, `/mutation-test`, `/code-review medium`, `/check-adrs`, `/verify`, in that order, then `/post-mortem`, which turns what the run cost into changes to the process.

Then commit on a feature branch, push, open a PR, and merge when CI is green, without asking. Small slices of one PRD may share a PR and a sign-off.

**The user tests an epic, never an issue** ([`0004`](./docs/adr/0004-an-issue-is-verified-on-the-emulator-and-an-epic-on-the-iphone.md)). The agent verifies each issue on the Android emulator, break-it tester included. When a PRD's last issue merges, the agent walks the whole epic there, runs the break-it tester over it, and hands the user a short script to test by hand on iOS. Building the next epic starts once the user passes it.

## Testing

**A unit owes its own test exactly when it owns an invariant, a judgement or a translation** ([`0001`](./docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md)). Everything else is driven through the screen test. Only the external boundaries listed there are stubbed, and a fake of a port is not a mock. Every test is given / when / then. **Assert the unknowns**: an unknown is never `0` and never a dash.

## Working rules

- Production code is written with Edit or Write, where probity judges it; the Bash guard rolls back anything else. A source file is deleted with Bash, in a command of its own; a test or a lint rule is the user's to delete. A refusal needs a real failing test.
- Never `gate | tail && commit`: check the gate's own status, and run `git status` before `git add -A`.
- Regroup commits on the merge-base. A conflicting PR gets `origin/main` merged in, never a rebase and force-push.

## Stack

Expo with a dev build (never Expo Go), Expo Router, TypeScript strict, NativeWind 4, expo-sqlite behind a port, React Hook Form with Zod ([`0009`](./docs/adr/0009-forms-are-react-hook-form-with-zod-and-the-domain-still-judges.md), not installed yet), Jest via jest-expo, RNTL, StrykerJS, probity. EAS Build for iOS, because the development machine runs Linux; Android builds locally.

## Agent skills

In [`.claude/skills/`](./.claude/skills/): `rn-dev` (read it first for any app change), `platform-conventions`, `component-testing-best-practices`, `verify`, `break-it` (an exploring tester on the emulator), `drive-emulator` and `agent-device` (how both drive the app), `debug`, `prototype` (new features and changes to screens, never a ported one), `mutation-test`, `check-adrs`, `post-mortem`, `feature-sign-off`.

### Issue tracker

GitHub issues on `skrymer/MacroPilot`, with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
