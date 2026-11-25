# Figures are fixed-size, and text scales to double

React Native multiplies every font size by the user's chosen scale, up to about 3.1 at iOS's largest accessibility size. A figure sized to its place, such as a day's calories in a ring, clips when it grows, and a clipped figure is less legible than an unscaled one. The sizes are provisional until they have been read on a phone.

## The decision

**Figure tokens never scale.** `text-figure-lg`, `text-figure`, and `text-unit` (the unit beside a figure) render with `maxFontSizeMultiplier` 1. Every figure token is large enough to be read by someone who needs 200% body text, which is what earns the exemption: a new token may take it only at 32pt or above, or as the unit beside one that does.

**Every other text token scales to double and stops**, which is what WCAG 1.4.4 asks for. One cap for all of them means every layout is checked at exactly two sizes.

**The cap is applied by one component, never by hand.** `src/components/Text.tsx` reads the size token and sets the multiplier; `Input` and `Link` do the same for a field and a link. React Native's own `Text` and `TextInput`, and expo-router's `Link`, are refused by `a11y/capped-text`. The caps live in `src/components/fontScaleCaps.ts`, and a test fails if a size in `tailwind.config.js` has none.

### A layout makes room for it

A cap says how large text may get; it does not say the screen survives it. And **display size is a second setting, which no cap touches**: it changes how many points wide the screen is. At Android's largest, a phone is 320dp wide. The two are set together by the people who need either, so the worst case is text at double on a screen 320dp wide. An entry's row failed there while passing at each alone: its figure refused to give way, and squeezed the name to two letters a line.

1. **Rows reflow.** A name and a figure stand side by side while both fit; otherwise the figure drops below the name. The content decides, by wrapping with a minimum width for the name. A threshold on the font scale is refused: it knows nothing about the name, the figure or the width.
2. **Nothing holding text has a fixed height, and nothing that matters is cut off with an ellipsis.** A button and a row grow; a screen scrolls.
3. **An issue is checked at the default size, and an epic at all of them.** The sizes are fixed and a script photographs them: text at double, a screen 320dp wide, and the two together, on every screen of the epic, in `/verify` of the epic. They are not left to the break-it tester: what must be looked at every time cannot depend on an explorer choosing it. The tester attacks what a fixed set cannot hold, such as a long name, or a size changed with a form half filled, and at the larger sizes only on an epic. Checking every size on every issue cost more time than its faults were worth: the last one it was spent on was a letter 7 px from the edge of a button, at the two largest settings together.

### The rules of the cap

- A nested span with no size token inherits its parent's cap, as it inherits its size.
- A class list naming two sizes takes the stricter cap, and a size behind a variant still counts.

## Alternatives rejected

- **Static sizes**, ignoring the setting. A predictable layout, unreadable to whoever enlarged their text.
- **A lower cap, such as 1.5.** Tidier at the largest settings, and short of 200%.
- **No cap.** iOS goes past three times, which breaks nearly any phone layout.
- **A multiplier written on every `Text`**: the same mapping, in a worse place.
- **`Text.defaultProps`**: React 19 removed it for function components.
- **A cap that depends on the screen**: a token would stop carrying its own rule.

## Consequences

- At the largest sizes a title is as large as the smallest figure. Legibility beats hierarchy.
- Android scales non-linearly from 14, so the same caps give different sizes there.
- At the largest settings a screen is long and needs more scrolling.
- A fault at a larger size is found at the end of an epic and not in the issue that made it, and is fixed then.
- iOS draws its own sizes, so each epic's script for the user includes the largest one.
