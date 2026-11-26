---
name: rn-dev
description: The build-and-test workflow for this React Native app (Expo dev build, TypeScript, Jest via jest-expo, @testing-library/react-native). Sets the architecture rules, the test strategy, the rendering rules, the commands and the gotchas. Use when building or changing any app functionality, such as a screen, component, hook, domain module or storage adapter, or its tests.
---

# RN dev

The playbook for any change under `src/` or `app/`. Read it first, build test-first. It links the canonical documents rather than restating them: `CONTEXT.md`, `docs/adr/`, and the sibling skills.

## Architecture rules

- **The domain core computes; the UI presents.** `src/domain/` imports no framework, port or adapter; ESLint enforces it ([`0002`](../../../docs/adr/0002-the-domain-core-is-framework-free.md)).
- **The directories carry meaning, and that is all the structure there is**: `src/domain/`, `src/storage/`, `src/lifecycle/`, `src/components/`, `app/`. No `ports/`, no `application/`, no DI container.
- **Everything is on the device** ([`0003`](../../../docs/adr/0003-data-and-rules-live-on-the-device.md)): no server, no account, no micronutrients.
- **An interface is earned by a second implementation.** One pattern: the interface, a provider and a `useX()` hook, the fake handed in by tests, the real adapter wired in `app/_layout.tsx`. `Clock` (`src/lifecycle/`) is the model.
- **Only the boundaries [`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md) lists are stubbed.** Adding one is a decision recorded there, and so is a new thing for a listed port to carry.
- **The clock is injected.** The day is `useToday()`. Never `clock.now()` in a render, which the React Compiler memoises: subscribe, as `useToday` does.
- **Text is `@/components/Text`, a field is `@/components/Input`, a link is `@/components/Link`.** Each caps font scaling; lint refuses the others.
- **A form is React Hook Form with a Zod schema** that translates and never judges; blank is unstated, never `0`. No `z.coerce.number()`, no `watch()` ([`0009`](../../../docs/adr/0009-forms-are-react-hook-form-with-zod-and-the-domain-still-judges.md)).
- **Domain terms are exact.** `CONTEXT.md` governs.

## Platform and design rules

Every rule a screen is held to is in [`platform-conventions`](../platform-conventions/SKILL.md). A `design/*`, `a11y/*` or `forms/*` error is fixed in the code, never by weakening the rule.

**Prefer the platform's own component.** Check what the SDK ships first (`expo-router/native-tabs`, sheets, `expo-haptics`, `expo-symbols`) and add it with `npx expo install`. A native package means a new dev build on both platforms, so batch them. Check that it exists on **both**: SF Symbols are iOS only.

**`app/design.tsx` has no test and no gate but the eye.** A change to it is not called fixed, in a report or a commit, until the photo at the size that failed has been looked at. A check that is not proven does not merge with the change it is meant to check.

## Rendering rules this domain requires

They live in one place each, read before a screen is built: how a figure, a total and what is **Not stated** are shown is `DESIGN.md`'s *Figures*, and the terms are `CONTEXT.md`'s; that a figure is derived once, in the domain, and that a day is the phone's day from the `Clock`, are [`0002`](../../../docs/adr/0002-the-domain-core-is-framework-free.md). Not restated here, so they cannot drift apart.

## Comments and TSDoc

A doc comment explains what is not obvious: units, ranges, an invariant the type cannot express. No history, no issue numbers, no dates, no restating the signature. Would it still be worth reading a year after the change that prompted it is forgotten?

```ts
/** Grams as eaten, unrounded. Undefined when the food states none, which is not zero. */
proteinG?: number;
```

## Test strategy

Test-first is enforced: probity judges every Write or Edit to the files in `probity.config.ts`, and the Bash guard rolls back any change Bash makes to them. A refusal means a real failing test has to be shown first; it is not a misfire. Refused for a helper that "exists nowhere": print its file in the transcript, then retry. **One new test per write, with a test run observed between them.** Run tests unpiped, so the failure text reaches the transcript. A change only the pixels can show is driven instead by its fault, measured in the emulator's pixels so that the figures are in a command's output ([`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md)); make that the last thing before the edit, with `drive-emulator`'s scripts: **a colour with `pixels.mjs`, a gap or a height with `spacing.mjs`**, which prints each as PASS or FAULT against its DESIGN.md token, for every class the edit changes. **The repair is the class on the element already drawn**: a new component, or one swapped in, is refused as new behaviour (CardSlice, ShowAll and a Button variant were, on #86), so it is extracted afterwards, as a refactor while green; and one change goes in one Edit, its imports with it. **Measure in one message, read it, and edit in the next**: the figures are printed by what measured them, a sentence echoed beside them is not a measurement, and what the output does not name was not measured. So is the space between things or inside one, with the gap measured before and after, and the touch target too where it is inside what is pressed: it is never made smaller. What only the device can show (focus as a page opens, the keyboard, how a page is presented, where it is scrolled to) is driven the same way, by a command's reading of it. **Where only the user's word can stand** (how iOS presents a page), ask one question that names every page it covers, its option the exact sentence, before the first edit: probity takes Today on a general decision and refuses Foods on the same one, and an issue comment you wrote is not the user's word. An edit sent in the same message as a refused one is refused unjudged by `probity.sh`; a run sent beside a refused edit is still yours to discard: a test that fails because the refused half is missing is not a red, and licenses nothing.

| Layer | Where | Skill |
| --- | --- | --- |
| Domain values, rules | `src/domain/**/*.test.ts`, no render | `tdd` |
| Storage translations | `src/storage/**/*.test.ts` over better-sqlite3 ([`0008`](../../../docs/adr/0008-sql-is-tested-against-better-sqlite3-behind-a-narrow-port.md)) | `tdd` |
| Screens and components | co-located `*.test.tsx` | `component-testing-best-practices` |

**Push a test down to the cheapest layer that can observe the behaviour**: a boundary value in the domain, the wiring through the screen.

**Every test is given / when / then**, each marked with a one-line comment; lint enforces it. A *when* with two actions asserts two things, and is split. **Assert the unknowns**, and give every absent-versus-zero guard an explicit zero test.

## Commands

| Command | What |
| --- | --- |
| `npm start` | Metro for the dev client |
| `npm run typecheck` · `lint` · `format` · `test` | The static gates and Jest (`domain`, `tooling`, `app` projects) |
| `npx expo export -p ios -p android` | Bundles without a device |
| `npx expo install --check` | Whether the tree agrees with the SDK |
| `npm run android` | Local Android dev build |
| `npx eas-cli build --profile development --platform ios` | The iOS dev build. The user runs it: it prompts for Apple credentials. Never install `eas-cli` in the project |

Once per clone: `git config core.hooksPath .githooks`.

## Gotchas

Symptom first. Add each one that costs a failure; never copy in one that has not.

- **A wait ends late, or never, after a night**: an Android timer does not count deep sleep, an iOS timer's target is a wall-clock date, and one a second or less away keeps iOS running on every frame. Look again, more than a second apart, as `useToday` does. The emulator does not sleep deeply and cannot show it.
- **`Cannot find module 'babel-preset-expo'`** on every bundle: it must be an explicit top-level dependency.
- **`Unable to resolve module console from @testing-library/react-native`** on export, while every test passes: a co-located test under `app/` reached the bundle. `metro.config.js` blocks them.
- **Every weight of a font ships**: import Expo Google Fonts per face (`@expo-google-fonts/<family>/400Regular`).
- **A new class does nothing on the phone**: restart Metro with `--clear`.
- **A screen test times out, its page rendering thousands of times**: the page sets, through its own `<Stack.Screen options>`, an option that changes its layout (`headerShown`), so each layout sets it again. What is fixed for a route (presentation, the header shown, its styling) goes on the route in `app/_layout.tsx`; the page sets only its title and its own handlers (`FormHeader`). Count renders before reaching for a stable-callback workaround: a constant options object looped too.
- **`npm ci` fails on EAS with a missing lockfile entry**: `eas.json` pins Node 24 through `base`; a new profile must extend it.
