# Design

**Not defined yet.** MacroPilot's design system is its own, for iOS and Android, with a light and a dark appearance. It is settled with the user, then written here.

Until then the app runs on placeholders: neutral greys in `design-tokens.js`, the system font, and a provisional type scale in `tailwind.config.js`. They exist so the lint rules and contrast tests have something to hold. Nothing should be designed around them.

What is already decided is mechanical rather than visual:

- Style through tokens. A missing token is added here first. [`0005`](./docs/adr/0005-styling-is-nativewind-and-components-are-copied-in.md)
- Both appearances come from the tokens, and no component writes `dark:`.
- Figures are fixed-size; text scales to double. [`0007`](./docs/adr/0007-figures-are-fixed-size-and-text-scales-to-double.md)
- An unknown is stated in words, never as a zero or a dash.
- An absence is never a modal.
