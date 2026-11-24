# Styling is NativeWind, and components are copied in rather than depended on

MacroPilot has a design system of its own, with a light and a dark appearance, still to be defined. A component library with opinions about colour and shape is fought on every screen, by one person, for as long as the project lasts.

## The decision

**Styling is NativeWind 4 over Tailwind 3.** Components name tokens (`bg-ground`, `text-ink-dim`) and never a raw value. `design/tokens-only` refuses a hex value, an arbitrary class and an inline colour.

**Colours live in `design-tokens.js`, once per appearance**, and `tailwind.config.js` turns each into a CSS variable that the system's appearance switches. So a token class is right in light and dark, and **no component writes `dark:`**: that would be a second palette nothing checks, and `design/no-dark-variant` refuses it. `tests/tokenContrast.test.ts` holds both appearances to WCAG.

**`DESIGN.md` is the prose and `app/design.tsx` the live reference.** If the two disagree, the screen is wrong. A missing token is added to DESIGN.md first. The values in the tokens today are neutral placeholders, not a design.

**The platform's own component comes first**: tab bar, sheet, picker, haptics. Each platform draws its own, with the semantics its users know, and a look-alike has to imitate and then maintain them. What is not native is copied into `src/components/` and is ours to restyle, not depended on.

**Chart mathematics lives in `src/domain/`** ([`0002`](./0002-the-domain-core-is-framework-free.md)). A chart component receives points and draws them, because the place a line is drawn through a day nobody logged is a claim about data.

## Alternatives rejected

- **React Native Paper**: Material is a system rather than a skin, and would be escaped screen by screen, on iOS as well.
- **Tamagui**: a compiler and a config language to debug, for one person.
- **StyleSheet alone**: token discipline becomes a convention a reviewer has to notice.
- **`dark:` variants per class**: each component then carries both palettes, and contrast cannot be tested from the tokens.

## Consequences

- Tailwind stays on 3 while NativeWind is on 4. They move together ([`0006`](./0006-dependencies-follow-the-sdk-and-upgrades-are-triggered.md)).
- A class new to the codebase is ignored on the phone until Metro restarts with `--clear`.
- A system that draws its own chrome (the splash, the tab bar's material) takes its colours from the Expo config or the platform, not from a class.
