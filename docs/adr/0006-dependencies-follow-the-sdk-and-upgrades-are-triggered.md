# Dependencies follow the Expo SDK, and upgrades are triggered rather than scheduled

The development machine runs Linux, so a native change on iOS costs a cloud build and a person with a phone.

## The decision

| Class | Governed by | Upgrades when |
| --- | --- | --- |
| `expo`, `expo-*`, `react`, `react-native`, `react-native-*` the SDK pins, `babel-preset-expo`, `jest-expo`, `eslint-config-expo` | The Expo SDK. `npx expo install --check` is the authority, and CI runs it | The SDK moves, never independently |
| Everything else | Us | A trigger fires |

A native package ahead of its SDK does not produce a version conflict. It produces a JavaScript half that no longer matches its native half, and symptoms that look like application bugs.

**Four triggers, and nothing else counts:** a security advisory we are exposed to (exposure, not count), a bug we hit, a feature we need now, or an SDK upgrade that forces it. "A new major exists" is not one.

**Packages that move together are grouped.** Tailwind bumped without NativeWind installs, typechecks and lints cleanly, then stops compiling class names. Renovate can express the group, which is why it was chosen over Dependabot.

**Releases of Expo's own packages within the current SDK are the one thing Renovate opens unprompted**, patches and point releases alike, as one grouped pull request, never automerged: `expo install --check` expects them the day they ship, and CI would otherwise go red on a branch nobody touched. A point release is a minor in semver, `expo` 58.0 to 58.1, and is still the same SDK: its major is the SDK. Only patches were proposed at first, and on 27 November 2026 SDK 58.1 turned every branch red with nothing proposed (#99). A new major is a new SDK, and stays a decision.

### The gate ladder

1. A branch, one concern per branch
2. `npm run typecheck`, `npm run lint`, `npm test`
3. `npx expo export -p ios -p android`
4. A native change, **any Expo SDK bump included, patches too**: a new EAS dev build for iOS and a local Android one. Purely build-time packages such as `babel-preset-expo` are exempt. The user runs the EAS build
5. `/verify` when the change touches storage, the camera, notifications or the life cycle

## Alternatives rejected

- **A calendar cadence.** Meaningless for the SDK's half, and make-work for ours.
- **Dependabot, or auto-merge on green.** Green is not correct for the Tailwind case.
- **Pin everything and never upgrade.** Several SDKs behind is archaeology.

## Consequences

- `package-lock.json` is the record of what was verified.
- Dependencies run deliberately stale.
- `renovate.json5` is the executable half. If the two disagree, this file is right.
