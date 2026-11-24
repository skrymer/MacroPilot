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
- **Only the boundaries [`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md) lists are stubbed.** Adding one is a decision recorded there.
- **The clock is injected.** Read it with `useNow()`, never `clock.now()` in a render: the React Compiler memoises that.
- **Text is `@/components/Text`, a field is `@/components/Input`, a link is `@/components/Link`.** Each caps font scaling; lint refuses the others.
- **A form is React Hook Form with a Zod schema** that translates and never judges; blank is unstated, never `0`. No `z.coerce.number()`, no `watch()` ([`0009`](../../../docs/adr/0009-forms-are-react-hook-form-with-zod-and-the-domain-still-judges.md)).
- **Domain terms are exact.** `CONTEXT.md` governs.

## Platform and design rules

Every rule a screen is held to is in [`platform-conventions`](../platform-conventions/SKILL.md). A `design/*` or `a11y/*` error is fixed in the code, never by weakening the rule.

**Prefer the platform's own component.** Check what the SDK ships first (`expo-router/native-tabs`, sheets, `expo-haptics`, `expo-symbols`) and add it with `npx expo install`. A native package means a new dev build on both platforms, so batch them. Check that it exists on **both**: SF Symbols are iOS only.

**`app/design.tsx` has no test and no gate but the eye.** A change to it is not called fixed, in a report or a commit, until the photo at the size that failed has been looked at. A check that is not proven does not merge with the change it is meant to check.

## Rendering rules this domain requires

- **An unknown is not a zero and not a dash.** An unlogged day is not 0 kcal; a food with no protein figure is not 0 g. Say it in words.
- **A known zero is shown.** It says the opposite of an unknown.
- **A figure is derived once, in the domain.** A screen never re-adds what it was given.
- **A day is the phone's day**, from the `Clock` and its offset at that reading.

## Comments and TSDoc

A doc comment explains what is not obvious: units, ranges, an invariant the type cannot express. No history, no issue numbers, no dates, no restating the signature. Would it still be worth reading a year after the change that prompted it is forgotten?

```ts
/** Grams as eaten, unrounded. Undefined when the food states none, which is not zero. */
proteinG?: number;
```

## Test strategy

Test-first is enforced: probity judges every Write or Edit to the files in `probity.config.ts`, and the Bash guard rolls back any change Bash makes to them. A refusal means a real failing test has to be shown first; it is not a misfire. **One new test per write, with a test run observed between them.** Run tests unpiped, so the failure text reaches the transcript. A change only the pixels can show is driven instead by its fault, measured in the emulator's pixels so that the figures are in a command's output ([`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md)); make that the last thing before the edit.

| Layer | Where | Skill |
| --- | --- | --- |
| Domain values, rules | `src/domain/**/*.test.ts`, no render | `tdd` |
| Storage translations | `src/storage/**/*.test.ts` over better-sqlite3 ([`0008`](../../../docs/adr/0008-sql-is-tested-against-better-sqlite3-behind-a-narrow-port.md)) | `tdd` |
| Screens and components | co-located `*.test.tsx` | `component-testing-best-practices` |

**Every test is given / when / then**, each marked with a one-line comment; lint enforces it. **Assert the unknowns**, and give every absent-versus-zero guard an explicit zero test.

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

- **`Cannot find module 'babel-preset-expo'`** on every bundle: it must be an explicit top-level dependency.
- **`Unable to resolve module console from @testing-library/react-native`** on export, while every test passes: a co-located test under `app/` reached the bundle. `metro.config.js` blocks them.
- **Every weight of a font ships**: import Expo Google Fonts per face (`@expo-google-fonts/<family>/400Regular`).
- **A new class does nothing on the phone**: restart Metro with `--clear`.
- **`npm ci` fails on EAS with a missing lockfile entry**: `eas.json` pins Node 24 through `base`; a new profile must extend it.
