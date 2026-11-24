# The domain core is framework-free, and ESLint enforces it

There is no backend to hold the rules ([`0003`](./0003-data-and-rules-live-on-the-device.md)). Without a line drawn inside the app they would drift into screens, where each is tested by rendering and none is tested at its boundaries.

## The decision

**The domain core computes; the UI presents.** `src/domain/` is pure TypeScript and may not import React, React Native, Expo, NativeWind, or the app's own ports and adapters. ESLint's `no-restricted-imports` enforces it, and `eslint-rules/domain.test.ts` holds the rule.

```
src/domain/      the rules: nutrition arithmetic, portions, days, targets, the trend, reviews
src/storage/     expo-sqlite adapters behind narrow ports, and their in-memory fakes
src/lifecycle/   the Clock port: SystemClock and ScriptedClock
src/components/  shared UI: presents values, judges nothing
app/             Expo Router screens: present values, judge nothing
```

A directory is added when it carries meaning. There is no `ports/`, no `application/`, and no dependency-injection container.

**An interface is earned by a second implementation**, usually the fake a screen test needs. Each port follows one pattern: the interface, a provider and a `useX()` hook, the fake handed in by tests, and the real adapter wired in `app/_layout.tsx`.

**`Clock`** is the first, because "today", "this week" and the day an Entry belongs to are judged from it. It carries `utcOffsetMinutes(at)`, asked per reading because summer time moves it, so a test can put the phone outside UTC. The domain never sees the port: its rules take `now` and the offset, or the day they decide, as plain values.

## Why

- Kept pure, the domain is tested in milliseconds, with no device and no render.
- The bugs here are plausible wrong numbers: a rounding, a day boundary, an unknown read as zero. Each needs many boundary cases, and a case that costs a render does not get written.
- [`0001`](./0001-a-unit-owes-its-own-test-when-it-owns-something.md) is only mechanical if what a file owns is visible from where it sits.

## Alternatives rejected

- **Rules in hooks**, the ordinary React Native shape. Each case then costs a render with fake timers, so three get written instead of twenty.
- **A `ports/` directory with an interface per dependency.** Ceremony ahead of need.

## Consequences

- A screen that computes a total is a defect, not a shortcut.
- The ESLint rule is load-bearing. Removing it to unblock something reverses this decision, and is argued as such.
