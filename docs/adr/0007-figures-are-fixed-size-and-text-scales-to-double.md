# Figures are fixed-size, and text scales to double

React Native multiplies every font size by the user's chosen scale, up to about 3.1 at iOS's largest accessibility size. A figure sized to its place, such as a day's calories in a ring, clips when it grows, and a clipped figure is less legible than an unscaled one. The sizes are provisional until they have been read on a phone.

## The decision

**Figure tokens never scale.** `text-figure-lg`, `text-figure`, and `text-unit` (the unit beside a figure) render with `maxFontSizeMultiplier` 1. Every figure token is large enough to be read by someone who needs 200% body text, which is what earns the exemption: a new token may take it only at 32pt or above, or as the unit beside one that does.

**Every other text token scales to double and stops**, which is what WCAG 1.4.4 asks for. One cap for all of them means every layout is checked at exactly two sizes.

**The cap is applied by one component, never by hand.** `src/components/Text.tsx` reads the size token and sets the multiplier; `Input` and `Link` do the same for a field and a link. React Native's own `Text` and `TextInput`, and expo-router's `Link`, are refused by `a11y/capped-text`. The caps live in `src/components/fontScaleCaps.ts`, and a test fails if a size in `tailwind.config.js` has none.

**Text the system draws from a size we give it is under the same cap.** A page's title in the system's header is drawn by react-native-screens, which holds it at one size at every text size: Android's toolbar title measured 71px at text 1.0 and at 2.0, and iOS draws a title at a fixed size once a font family is set. So its size is given already scaled, by `fontScaleCaps`' `scaledBy` (from a token of the type scale) or `systemScaledBy` (from the system's own size), capped at double. iOS's title in the bar stays at UIKit's 17pt, as UIKit keeps it in a bar of fixed height; its large title scales (the user's word, 26 November 2026, on #85). **Android's toolbar title stops at 1.5** (the user's word, 27 November 2026, on #87), for the same reason: it is one line, 870px wide on a 1080px phone, and a form's title, which says what the form does, is the longest there. Android 14 and later scale the size it is given again, on their own non-linear curve (on API 36 the title's letters measured 99px at double where the size given alone made 86, and 91px at 1.8 where it made 77, as the curve has it), so *Log an estimate*, 437px at text 1.0, was cut to *Log an esti…* at double and to *Log an estim…* at 1.8. At 1.5 it is about 814px. A longer title is checked at double against that line before it is given.

### A layout makes room for it

A cap says how large text may get; it does not say the screen survives it. **Display size is a second setting, which no cap touches**: it changes how many points wide the screen is, down to 320dp on a phone at Android's largest. A screen that narrow is never checked, by the user's decision. The rules below were written for both, and still hold a layout together on one.

1. **Rows reflow.** A name and a figure stand side by side while both fit; otherwise the figure drops below the name. The content decides, by wrapping with a minimum width for the name. A threshold on the font scale is refused: it knows nothing about the name, the figure or the width.
2. **Nothing holding text has a fixed height, and nothing that matters is cut off with an ellipsis.** A button and a row grow; a screen scrolls.
3. **An issue is checked at the default size, and an epic at double too**, on every screen the epic has, by a script in `/verify` of the epic. **An issue that moves text out of `Text`**, to the system or to a component that sizes it some other way, **is checked at double in that issue**: the cap went with the text, and #85's header title kept one size at double until its own verify looked. It is not left to the break-it tester: what must be looked at every time cannot depend on an explorer choosing it. The tester attacks what a fixed set cannot hold, such as a long name, or a size changed with a form half filled, and at double only on an epic. Checking five sizes on every issue, narrow screens among them, cost more time than its faults were worth: the last one it was spent on was a letter 7 px from the edge of a button, at the two largest settings together.

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
- A fault at double is found at the end of an epic and not in the issue that made it, and is fixed then, unless the issue moved text out of `Text`. One on a narrow screen is not looked for.
- iOS draws its own sizes, so each epic's script for the user includes the largest one.
