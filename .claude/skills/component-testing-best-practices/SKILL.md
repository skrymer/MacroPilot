---
name: component-testing-best-practices
description: React Native component and screen testing conventions using @testing-library/react-native under jest-expo, following the Testing Library guiding principles and React Native's testing guide. Covers query priority, interactions, driving the app's ports, what the testing/perceivable-only lint rule refuses, and the anti-patterns. Use when writing or editing component or screen tests (*.test.tsx), when a testing/perceivable-only error fires, or when deciding how to query, render or interact with a component under test.
---

# Component testing best practices

Jest component and screen tests for the React Native app. The walk-through on a device is a separate concern — see the `verify` skill.

## Guiding principle

> The more your tests resemble the way your software is used, the more
> confidence they can give you.
> — <https://testing-library.com/docs/guiding-principles>

Test observable behaviour through the accessibility tree, never implementation details. A good test survives any refactor that doesn't change what the user sees or does. [React Native's testing guide](https://reactnative.dev/docs/testing-overview) says the same: test "from the user perspective", avoid "making assertions on component props or state" and testID queries, and "prefer explicit expectations" over snapshots.

**A component test runs in Node and sees no platform code.** Colour, the ground, safe areas and clipping at Larger Text are not observable here, and asserting the styles that produce them is the implementation detail this skill refuses. How a screen looks is `/verify`'s ([`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md) records why).

## Quick start

```tsx
it('names the day on the phone, not in UTC', async () => {
  // Given a phone two hours ahead of UTC, at 23:30 UTC
  const clock = new ScriptedClock();
  clock.setUtcOffset(120);
  clock.advance(Date.UTC(2026, 10, 24, 23, 30));

  // When the day screen opens
  await render(
    <ClockProvider clock={clock}>
      <Day />
    </ClockProvider>,
  );

  // Then it is already the 25th there
  expect(screen.getByRole('header', { name: 'Wednesday 25 November' })).toBeOnTheScreen();
});
```

**`render` is async and must be awaited.** RNTL 14 made it so, and an unawaited
call fails in a way that names the wrong thing: `screen` stays unbound and the
next query throws `render function has not been called`, which reads as a
missing render rather than a missing `await`.

A screen reads its ports through their hooks (`useClock()`), and a test hands in the fake through the provider. **A screen that cannot be handed a fake is one that can only be tested on a phone.**

## Query priority

Find elements the way a user or assistive technology would:

1. `getByRole` with `{ name }` — buttons, headings, switches
2. `getByLabelText` — anything carrying an `accessibilityLabel`
3. `getByText` — non-interactive content

No `getByTestId`: an element no user and no screen reader can find is one the test should not be finding either, and the lint rule refuses it. If nothing above can address an element, it needs a role or a label, which VoiceOver wants anyway.

`getBy*` throws when absent; `queryBy*` returns `null` (for "is not there" assertions); `findBy*` is async (to wait for something to appear). Scope with `within(...)` rather than reaching for test IDs.

## Interactions

Drive interaction with `userEvent`, not `fireEvent` — it reproduces real behaviour including press timing. Call `userEvent.setup()` once per test and `await` every interaction.

## Driving the ports

- **Time.** Move `ScriptedClock` on by hand: `advance` runs each scheduled call at the time it was due, and `setUtcOffset` puts the phone outside UTC. Never depend on real elapsed time, and wrap an `advance` that changes the screen in `act`.
- **Storage.** Hand the screen the in-memory fake of its store. To prove something persists, unmount and render again over the same fake, rather than asserting on a log of calls.
- **Never `await` a fixed delay.** Use `findBy*`, which retries.

## Conventions

- Co-locate: `app/day.tsx` → `app/day.test.tsx`.
- One behaviour per test; the name reads as a capability the user has.
- Every test runs on its own: no test depends on another having run first.
- Assert on what the user perceives — visible text, roles, accessible state.
- **Assert the unknowns.** For every test that a figure renders, a sibling asserts it is *absent* when the domain cannot compute it. A food with no protein figure is the standing example: a stated unknown, never `0 g` and never a dash. A known zero gets its own test, and is shown.
- For mutually-exclusive states, assert the alternatives are absent (`queryBy*` + `.not.toBeOnTheScreen()`). A positive-only check still passes if a regression renders "nothing logged" beside a total.
- Never assert on styles, component internals, or props passed to a child.
- Run the suite after writing; proceed only when green.

## Enforced by lint

`testing/perceivable-only` (`eslint-rules/perceivable-only.js`) runs on every `*.test.tsx` under `app/` and `src/`, and the `PostToolUse` hook reports it on the edit that introduced the problem. Fix the test, never the rule.

| Refused | Why | Instead |
| --- | --- | --- |
| `el.props.…`, `toHaveProp('className')` | A prop is an implementation detail | Text, role, label |
| `toHaveStyle` | Jest cannot see how the platform draws it | `/verify` |
| `toMatchSnapshot`, `toMatchInlineSnapshot` | Whatever rendered is frozen as correct | An explicit expectation |
| `*ByTestId` | Invisible to the user and to VoiceOver | Role, label or text |
| `UNSAFE_*`, `screen.root` | The component tree, not the screen | Role, label or text |
| `fireEvent` | Skips what a real press does | `await user.press(el)` |
| `react-test-renderer` | Deprecated | `@testing-library/react-native` |

**`toHaveProp` stays allowed for what the system reads on the user's behalf:** `accessibility*`, `aria-*`, `role`, and `maxFontSizeMultiplier`, which iOS reads for Larger Text ([`0007`](../../../docs/adr/0007-figures-are-fixed-size-and-text-scales-to-double.md)). These are the "accessibility helpers" the React Native guide prefers.

## Anti-patterns

| Avoid | Use instead |
| --- | --- |
| Mocking `expo-sqlite` in a screen test | Hand the screen an in-memory store through its provider |
| `await new Promise(r => setTimeout(r, 500))` | `findBy*`, or advance fake timers |
| Reaching for a maths boundary case through a render | Test it in `src/domain/`, where it lives |

The last row is the one most likely to be violated under pressure. If a screen test is driving a boundary case in the arithmetic, the arithmetic is being tested in the wrong place — see [`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md).
