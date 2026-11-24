# Figures are fixed-size, and text scales to double

React Native multiplies every font size by the user's chosen scale, up to about 3.1 at iOS's largest accessibility size. A figure sized to its place, such as a day's calories in a ring, clips when it grows, and a clipped figure is less legible than an unscaled one. The sizes are provisional until the design system is defined.

## The decision

**Figure tokens never scale.** `text-figure-lg`, `text-figure`, and `text-unit` (the unit beside a figure) render with `maxFontSizeMultiplier` 1. Every figure token is large enough to be read by someone who needs 200% body text, which is what earns the exemption: a new token may take it only at 32pt or above, or as the unit beside one that does.

**Every other text token scales to double and stops**, which is what WCAG 1.4.4 asks for. One cap for all of them means every layout is checked at exactly two sizes.

**The cap is applied by one component, never by hand.** `src/components/Text.tsx` reads the size token and sets the multiplier; `Input` and `Link` do the same for a field and a link. React Native's own `Text` and `TextInput`, and expo-router's `Link`, are refused by `a11y/capped-text`. The caps live in `src/components/fontScaleCaps.ts`, and a test fails if a size in `tailwind.config.js` has none.

- A nested span with no size token inherits its parent's cap, as it inherits its size.
- A class list naming two sizes takes the stricter cap, and a size behind a variant still counts.

## Alternatives rejected

- **A multiplier written on every `Text`**: the same mapping, in a worse place.
- **`Text.defaultProps`**: React 19 removed it for function components.
- **A cap that depends on the screen**: a token would stop carrying its own rule.

## Consequences

- At the largest sizes a title is as large as the smallest figure. Legibility beats hierarchy.
- Android scales non-linearly from 14, so the same caps give different sizes there.
- `/verify` checks the largest text setting on both platforms.
