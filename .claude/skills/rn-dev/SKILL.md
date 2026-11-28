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
- **The clock is injected.** The day shown is `useToday()`. Never `clock.now()` in a render, which the React Compiler memoises: subscribe, as `useToday` does. **The day a write lands on is read at the press**, `dayAt(clock, clock.now())`, as `useLogEntry` does: `useToday` looks every two seconds, so a press just after midnight still holds yesterday (#131, a Goal set on the day before). A form whose day is fixed when it opens is the exception (the weight form, 6ab5f1f); a form modelled on another says which of the two it is.
- **Text is `@/components/Text`, a field is `@/components/Input`, a link is `@/components/Link`.** Each caps font scaling; lint refuses the others.
- **A form is React Hook Form with a Zod schema** that translates and never judges; blank is unstated, never `0`. No `z.coerce.number()`, no `watch()` ([`0009`](../../../docs/adr/0009-forms-are-react-hook-form-with-zod-and-the-domain-still-judges.md)).
- **Domain terms are exact.** `CONTEXT.md` governs.

## Transactions

The stores share **one** expo-sqlite connection, and SQLite keeps one transaction per connection: any call made while one is open joins it, whoever made it. So a store write of more than one statement goes through the port's `withTransactionAsync`, never a hand-rolled `BEGIN`, and never expo's own `withTransactionAsync` (the same flaw: its docs say other async queries "will be included in the transaction") or `withExclusiveTransactionAsync` (a new connection a call: foreign keys off, competing writes fail with `database is locked`, and better-sqlite3 in memory cannot mirror it).

`SerialDatabase` (`src/storage/SerialDatabase.ts`) is the one implementation, wrapped round the phone's connection in `app/_layout.tsx` and round better-sqlite3 by `BetterSqliteDatabase`, so Jest runs what the phone runs. It runs every call in turn, and a transaction holds the turn from `BEGIN` to `COMMIT`. What it does when a task fails, and why, is ADR 0008's *Amended: transactions, and a connection whose calls run in turn*.

```ts
async save(review: Review): Promise<void> {
  const db = await withSchema(this.db); // before the transaction: a pragma inside one does nothing
  await db.withTransactionAsync(async (tx) => {
    await tx.runAsync('INSERT OR REPLACE INTO reviews (…) VALUES (?, ?, ?, ?, ?)', […]);
    await tx.runAsync('DELETE FROM reviews WHERE day > ?', [review.day]);
  });
}
```

- **The task calls `tx`, never `this.db`**: a call on the database waits for the turn the task holds, and never comes.
- **Nothing but statements in the task**: no network, no waiting on the user. Every other screen's read waits for it.
- **Each transaction is tested** against better-sqlite3 (ADR 0008): every statement kept on success; none when a statement fails, made to fail with a trigger (`CREATE TRIGGER refuse BEFORE DELETE ON reviews BEGIN SELECT RAISE(ABORT, 'refused'); END;`), and the save rejects with that fault; and two calls that overlap both kept (`Promise.all`). `SerialDatabase.test.ts` holds the turn's own guarantees once: commit, rollback, the task's fault over the rollback's, a call made meanwhile kept out, and the next call after a failure.
- A test of a guarantee `SerialDatabase` already keeps shows its red first against a copy without it (the `COMMIT`, the `.catch` on `ROLLBACK`, the turn): *Test strategy*, below.

## Platform and design rules

Every rule a screen is held to is in [`platform-conventions`](../platform-conventions/SKILL.md). A `design/*`, `a11y/*` or `forms/*` error is fixed in the code, never by weakening the rule.

**A screen is built from the components that carry Trim's decisions, never drawn by hand.** [*Trim, by component*](../platform-conventions/SKILL.md#trim-by-component) names each, the lint rule that holds it, and the DESIGN.md section that gives its reason.

**Prefer the platform's own component.** Check what the SDK ships first (`expo-router/native-tabs`, sheets, `expo-haptics`, `expo-symbols`) and add it with `npx expo install`. A native package means a new dev build on both platforms, so batch them. Check that it exists on **both**: SF Symbols are iOS only.

**`app/design.tsx` has no test and no gate but the eye, and `spacing.mjs`.** A change to it is not called fixed, in a report or a commit, until the photo at the size that failed has been looked at. The eye judges colour and clipping; every margin or gap an edit moves or carries over is measured with `spacing.mjs`, before and after, since a 2dp fault passes a photo (on #110 the page's `px-4` was carried onto its new root, 22 photos called clean, and code review found it at 13.7dp against 16). A check that is not proven does not merge with the change it is meant to check.

## Rendering rules this domain requires

They live in one place each, read before a screen is built: how a figure, a total and what is **Not stated** are shown is `DESIGN.md`'s *Figures*, and the terms are `CONTEXT.md`'s; that a figure is derived once, in the domain, and that a day is the phone's day from the `Clock`, are [`0002`](../../../docs/adr/0002-the-domain-core-is-framework-free.md). Not restated here, so they cannot drift apart.

## Comments and TSDoc

A doc comment explains what is not obvious: units, ranges, an invariant the type cannot express. No history, no issue numbers, no dates, no restating the signature. Would it still be worth reading a year after the change that prompted it is forgotten?

```ts
/** Grams as eaten, unrounded. Undefined when the food states none, which is not zero. */
proteinG?: number;
```

## Test strategy

Test-first is enforced: probity judges every Write or Edit to the files in `probity.config.ts`, and the Bash guard rolls back any change Bash makes to them. A refusal means a real failing test has to be shown first; it is not a misfire. **One new test per write, with a test run observed between them.** **A committed test is the user's**: `test-guard.sh` refuses any write that would change or remove one, so a test is added with Edit beside the others, never by writing the file whole from memory (on #129 three committed tests were retyped that way, with an assertion added to two of them); to change a committed test, ask first.

**A test of a guarantee the code already keeps shows its red first**, against a copy with the guarantee taken out, never by editing the source (probity and the Bash guard refuse that). Copy the source to the scratchpad, its relative imports pointed at the copies, remove the one line or turn the one operator (the mutant Stryker named, when it is a mutation gap), and run the test from there with the project's Babel config; the command's output naming the failing test is the red. Then the test goes into the repo, added beside the others. A `-t` run that matched no test (*skipped*) is not a red. On #129 this was the red for the transaction tests, `daysBetween`, `againstBudget`'s clamp and a seed of exactly 0.

```bash
npx jest --rootDir "$scratch/run" --config '{"testEnvironment":"node","transform":{"^.+\\.tsx?$":["babel-jest",{"configFile":"'"$PWD"'/babel.config.js"}]},"moduleDirectories":["node_modules","'"$PWD"'/node_modules"]}'
```

**A refactor goes through the refactor window, not probity** (`.claude/hooks/refactor.mjs`, whose header has the rules). `node .claude/hooks/refactor.mjs open <the tests that cover the code>` runs them, green and unpiped, and opens only with no test file changed since HEAD; make the refactor in as many Edits as it takes; then `node .claude/hooks/refactor.mjs close`, which reruns them with `tsc` and ESLint. A red close rolls the source back to the window's start. No test changes during a window (a test write is still judged), and new behaviour never rides in one: it is a separate red-green slice after the close. The window lasts 30 minutes. Code only a flow covers (Android's form X, which Jest never renders) is refactored outside it, under `probity.config.ts`'s *A refactor that moves code*. A refactor is never dropped for being small. Run tests unpiped, so the failure text reaches the transcript. A change only the pixels can show is driven instead by its fault, measured in the emulator's pixels so that the figures are in a command's output ([`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md)); make that the last thing before the edit, with `drive-emulator`'s scripts: **a colour with `pixels.mjs`, a gap or a height with `spacing.mjs`**, which prints each as PASS or FAULT against its DESIGN.md token, for every class the edit changes. A colour names its token (`gap=522,1293:line`, `figure=500,640:over@dark`): a bare hex says nothing of what it should be, and on #129 probity twice refused the ring's flat ends over a gap measured that way. **The repair is the class on the element already drawn**: a new component is refused as new behaviour (CardSlice, ShowAll and a Button variant were, on #86), so one that does not exist yet is extracted afterwards, in a refactor window. **An existing component that is the right one is swapped in, never copied**, in a refactor window: a copy of its markup on the element is the worse version (the user's word on #87, for `Failure`). One change goes in one Edit, its imports with it. **Measure in one message, read it, and edit in the next**: the figures are printed by what measured them, a sentence echoed beside them is not a measurement, and what the output does not name was not measured. So is the space between things or inside one, with the gap measured before and after, and the touch target too where it is inside what is pressed: it is never made smaller. What only the device can show (focus as a page opens, the keyboard, how a page is presented, where it is scrolled to) is driven the same way, by a command's reading of it. **Where only the user's word can stand** (how iOS presents a page), ask one question that names every page it covers, its option the exact sentence, before the first edit: probity takes Today on a general decision and refuses Foods on the same one, and an issue comment you wrote is not the user's word. Nor is a photo: when the user reports a fault with a photo alone, ask for the sentence in the reply that reads the photo, and record their sentence, never your description of it. An edit sent in the same message as a refused one is refused unjudged by `probity.sh`; a run sent beside a refused edit is still yours to discard: a test that fails because the refused half is missing is not a red, and licenses nothing. **Nor is a query that finds nothing**: make it a `getBy` or `findBy`, so the failure prints the tree, and read what the tree shows before calling the red the right one (on #127 a field that still said *Choose a date* was taken for a date read a day early). A fault only the device shows is measured on the device as the last step before the edit, never stood in for by a Jest test written to get past probity: Jest's Node follows a change of zone that the phone's Hermes does not, and that test passed on the old code too.

**A screen ported from the reference app takes its words from the reference's source** at the recorded commit, into its first tests: labels, refusals, failures, placeholders, the date's format. **So does a ported domain rule its refusals**: every `require`, `check` and constructor guard of the reference's classes it touches (and of those they build) becomes one of its first tests, and the brief to whoever reads the reference asks for them by name. Verify's comparison checks them; it is not where they are found (on #127 the words were, and the rewrite cost a full gate cycle; on #129 `Maintenance`'s `require(kcal > 0)` was, as a negative budget, and its fix cost another).

| Layer | Where | Skill |
| --- | --- | --- |
| Domain values, rules | `src/domain/**/*.test.ts`, no render | `tdd` |
| Storage translations | `src/storage/**/*.test.ts` over better-sqlite3 ([`0008`](../../../docs/adr/0008-sql-is-tested-against-better-sqlite3-behind-a-narrow-port.md)) | `tdd` |
| Screens and components | co-located `*.test.tsx` | `component-testing-best-practices` |

**Push a test down to the cheapest layer that can observe the behaviour**: a boundary value in the domain, its end case (20 kg taken) written red against the stub before the comparison, since once `>=` is in probity refuses the end as characterization and Stryker asks for it a run later (#127's `ageOn`, #128's `isWeight`); the wiring through the screen.

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
- **A chosen calendar date reads a day early after the phone is moved east with the app open**: a `Date` made at the phone's midnight keeps the zone the app started in, and the system's picker takes the new one. A date is a day, not a moment: hold it at midnight in UTC, read it with `getUTC*`, format it and hand it to the pickers in UTC, as `DateField` does. Jest cannot show it (Node follows the zone change); the emulator can, with `cmd alarm set-timezone` while the app is open.
- **`Cannot find module 'babel-preset-expo'`** on every bundle: it must be an explicit top-level dependency.
- **`Unable to resolve module console from @testing-library/react-native`** on export, while every test passes: a co-located test under `app/` reached the bundle. `metro.config.js` blocks them.
- **Every weight of a font ships**: import Expo Google Fonts per face (`@expo-google-fonts/<family>/400Regular`).
- **A new class does nothing on the phone**: restart Metro with `--clear`.
- **A screen test times out, its page rendering thousands of times**: the page sets, through its own `<Stack.Screen options>`, an option that changes its layout (`headerShown`), so each layout sets it again. What is fixed for a route (presentation, the header shown, its styling) goes on the route in `app/_layout.tsx`; the page sets only its title and its own handlers (`FormHeader`). Count renders before reaching for a stable-callback workaround: a constant options object looped too.
- **A form's button stays under the keyboard on iOS's sheet, though Android clears it**: `measureInWindow` is measured in the React surface and does not see how far the sheet stands below the screen's top. `FormPage` takes the page's top as the screen less the page.
- **`npm ci` fails on EAS with a missing lockfile entry**: `eas.json` pins Node 24 through `base`; a new profile must extend it.
