# Data and rules live on the device

MacroPilot is a personal macro and calorie tracker for **iOS and Android**. Where its data sits and where its rules run decides almost everything structural, so it is settled before any feature.

## The decision

**Everything is on the phone.** The rules are pure TypeScript in `src/domain/` ([`0002`](./0002-the-domain-core-is-framework-free.md)) and the data is in expo-sqlite. There is no server, no account and no sign-in. The app works offline, and only looking up a product needs the network.

**One phone, one person.** Nothing in the model owns a row, because there is nobody else to own one.

**The phone's clock is the only clock.** "Today" is the day on the phone, read through the `Clock` port, which carries the UTC offset.

**Micronutrients are out of scope.** The app tracks energy and the macros. Vitamins, minerals and dietary fibre are not modelled, stored or shown.

## Alternatives rejected

- **A client of a backend.** One history reachable from anywhere. Rejected: logging a meal would need the network, a native sign-in and a server to run.
- **On the device, with sync designed in now.** Ids and timestamps chosen for a sync nobody has asked for. Rejected as ahead of need.

## Consequences

- Losing the phone loses the data unless the system's backup has it. Export and import are not decided here.
- A provider key shipped in an app is public, so a nutrition provider that needs one needs its own decision.
- Adding sync later is a new decision that may change how rows are identified.
