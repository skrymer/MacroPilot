---
name: platform-conventions
description: The rulebook for what a screen in this app may and may not do on iOS and Android. Covers the design tokens, how absence renders, accessibility (touch targets, roles, font scaling, contrast) and the platform rules, and for each gives how it is enforced and what to write instead. Use when building or reviewing any screen or component, when a design/*, a11y/* or forms/* lint error fires, or when adding a Pressable, colour, text, link or permission prompt.
---

# Platform conventions

**Fix the code, never the rule.** A wrong rule is argued in DESIGN.md or an ADR first, then changed here.

## Trim, by component

Each decision is carried by a component in `src/components/`, so a screen gets it wrong only by leaving that component. Build from these; the reason is in the DESIGN.md section linked, and nowhere else.

| A screen needs | Use | Held by | Why |
| --- | --- | --- | --- |
| A tab's page and its title | `PageStack`, its options from `barHeader` | Review; a route's fixed options go in `app/_layout.tsx` (rn-dev, *Gotchas*) | [*Pages*](../../../DESIGN.md#pages) |
| A form: its presentation, X, title, card, and button above the keyboard | `FormPage`; `useFormPresentation` on the route in `app/_layout.tsx`, `FormHeader` for the title and X | `forms/form-page` (the card and the keyboard); the presentation and header by review | [*Forms*](../../../DESIGN.md#forms) |
| A field, at fault in `fault` or right in `valid`, each with its sign | `FormField` (`fieldLook`, `signs.ts`), judged `onTouched` | `forms/form-page`, `forms/on-touched` | [*Forms*](../../../DESIGN.md#forms) |
| A refused form's first fault in view, and its words above the button | `useFirstFault`, `formFault` | `forms/first-fault-shown` | [*Forms*](../../../DESIGN.md#forms) |
| Leaving a form with something typed | `useDiscard` | Screen test | [*Asking and telling*](../../../DESIGN.md#asking-and-telling) |
| A button, with the platform's press | `Button` (`useRipple`) | `design/no-bare-pressable`, `a11y/*` | [*Controls*](../../../DESIGN.md#controls) |
| A list in one card | `CardSlice` per row, `Hairline` between, `Row` | Review | [*Pages*](../../../DESIGN.md#pages), [*Lists and rows*](../../../DESIGN.md#lists-and-rows) |
| A row deleted by a swipe, asked first | `DeletableRow`, `useDelete`, `useFailedInView` | Screen test | [*Lists and rows*](../../../DESIGN.md#lists-and-rows) |
| The rest of a long list | `ShowAll` | `design/no-bare-pressable` | [*Lists and rows*](../../../DESIGN.md#lists-and-rows) |
| An empty list under a summary | `EmptyLine` | Review | [*Lists and rows*](../../../DESIGN.md#lists-and-rows) |
| A page with nothing else on it | `Notice` | Review | [*Lists and rows*](../../../DESIGN.md#lists-and-rows) |
| It failed: a page unread, a delete, a save | `Failure`; `Unreadable` in place of a page, with *Retry* | Review | [*Asking and telling*](../../../DESIGN.md#asking-and-telling) |
| Text, a field, a link | `Text`, `Input`, `Link` | `a11y/capped-text` | [`0007`](../../../docs/adr/0007-figures-are-fixed-size-and-text-scales-to-double.md) |

A decision with no component yet (the *Logged:* card, drawn on Log) gets one when a second screen needs it.

## Enforced by lint

In `eslint-rules/`, wired in `eslint.config.js`. A `PostToolUse` hook lints each file as it is written.

| Rule | Reports | Instead |
| --- | --- | --- |
| `design/tokens-only` | A hex or `rgb()` value, a `[...]` class, a colour in a style or colour prop | A token class; a missing token goes in DESIGN.md first |
| `design/no-dark-variant` | Any `dark:` variant | A token, which already switches with the appearance ([`0005`](../../../docs/adr/0005-styling-is-nativewind-and-components-are-copied-in.md)) |
| `design/no-dash-placeholder` | A dash as display text or a fallback | Words for the absence ("not logged") |
| `design/no-bare-pressable` | A `Pressable` outside `src/components/`, the design page and a prototype | The component that carries the control (`Button`, `ShowAll`, …), above |
| `a11y/touch-target` | A Pressable without `min-h-target min-w-target` or `hitSlop` | Add both floors; `h-11` is 38.5pt on native |
| `a11y/pressable-role` | A Pressable without a role | `accessibilityRole="button"` |
| `a11y/no-font-scaling-off` | `allowFontScaling={false}` | `@/components/Text` |
| `a11y/capped-text` | React Native's `Text`/`TextInput`, expo-router's `Link` | `@/components/Text` · `Input` · `Link` ([`0007`](../../../docs/adr/0007-figures-are-fixed-size-and-text-scales-to-double.md)) |
| `forms/no-coerced-number` | `z.coerce.number()`, which makes a blank 0 | `optionalFigure` in `src/components/figureText.ts` ([`0009`](../../../docs/adr/0009-forms-are-react-hook-form-with-zod-and-the-domain-still-judges.md)) |
| `forms/no-watch` | A form's `watch()`, stale under the React Compiler | `useWatch` |
| `forms/form-page` | A `FormField` outside `FormPage`; a `KeyboardAvoidingView` anywhere but `FormPage` | `FormPage`, which keeps the button above the keyboard and the fields clear of iOS's bar (DESIGN.md, *Forms*) |
| `forms/on-touched` | A `useForm` without `mode: 'onTouched'` | `mode: 'onTouched'` (DESIGN.md, *Forms*) |
| `forms/first-fault-shown` | A form of several fields without `useFirstFault` and `formFault` | Both (DESIGN.md, *Forms*) |
| `testing/perceivable-only` | Props, styles, snapshots, test IDs in a `*.test.tsx` | Text, role or label |
| `no-restricted-imports` | `Alert` under `app/`; frameworks, ports and adapters in the domain | State the condition in place; pass plain values |
| `no-restricted-properties` / `-syntax` | `Date.now()`, `performance.now()`, bare `new Date()` | The `Clock` port |

## Enforced by tests

| Rule | Test |
| --- | --- |
| Portrait, follows the system appearance, one identifier on both platforms | `tests/expoConfig.test.ts`, on the resolved config |
| Every text pair is at least 4.5:1 (3:1 large) **in both appearances**, and both define the same tokens | `tests/tokenContrast.test.ts`. A new text colour fails until its pair is listed; a new ground is added by hand |
| Every size in the type scale has a font-scale cap | `tests/fontScaleCaps.test.ts` |

## Not automatable

[REFERENCE.md](REFERENCE.md): safe areas, the keyboard, permissions, haptics, the status bar, what a screen reader says. [ANDROID.md](ANDROID.md): where Android differs.

## Links and library text

A link is a view at the target floor, not a text span, so it cannot sit inside a sentence: put it beside the text. A library component that draws its own text skips the cap; it gets a wrapper in `src/components/` and an entry in `a11y/capped-text`.

## Adding a rule

Argue it in DESIGN.md or an ADR, write the failing test, implement and wire it, add its row here.
