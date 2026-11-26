# Trim: the design system

Trimming an aircraft is the small correction that holds a course. The app does that with a day's eating, and the weekly review does it with the targets.

The live reference is `app/design.tsx`, on the Developer tab. **If this file and that page disagree, the page is wrong.** The thesis, the rings, the colours and the typeface are settled, read on an iPhone in dark. The scale is provisional, and light has been read only on an emulator.

## Thesis

> **Food has no colour. Colour is only where your day stands against its targets.**

The reading condition: a kitchen, one hand, a few seconds, about ten times a day, in bright light or at night. The question each time is *where does my day stand?*

**No food is good or bad; only the day earns a verdict.** A palette that lends a food a hue will sooner or later lend it an opinion. Here it cannot: the hues have one job, and no food, control or heading may carry one.

## The two axes

| Axis | Owns | Never |
| --- | --- | --- |
| **Identity: ink and ground** | Text, figures, food, controls, navigation | Expresses a verdict |
| **Standing: the three hues** | The rings' arcs, a day's verdict, what is drawn against a target | A button, a link, a heading, a food |

**Grounds** are neutral and a little warm: `ground`, `surface` (a card), `surface-lift` (a thing on a card), `line`. **Inks** are `ink`, `ink-mid`, and `ink-dim` for a stated absence.

**The hues are a ladder**: `within` (teal), `slightly-over` (amber), `over` (red). In dark the red is clearly darker than the other two, so *over* is seen without its hue; teal and amber are not told apart that way, and have their words. Teal rather than green, because green beside red is a judgement, and the pair most often confused. **Colour is never the only signal**: every verdict is also words.

Both appearances are in `design-tokens.js`, and every pair is held to WCAG in both.

## Signature: the rings

**The full circle is the target.** The day is two arcs: calories outside and thick, protein inside and thin. They are told apart by place, width and name, never by hue, so **protein's standing is also in words**, on the card and in what a screen reader hears. The goal is one arc. The arc takes the hue of where it stands; its track is `line`. Its ends are round, and flat once the gap left is too small for round ones, which would meet and read as a fault. An empty day is an empty track, not a missing ring.

The figure in the centre is `ink` while the day is within its budget, `slightly-over` past it and `over` past the tolerance: the arc and the figure say one thing. It is the one figure that takes a hue, because it is the day's standing and not a food's. The goal's is always `ink`.

## Figures

| A figure that is | Is set |
| --- | --- |
| **Weighed** | Solid: B612 Bold, `ink` |
| **Estimated** | Lighter: B612 Regular, `ink-mid`, and says *about* or *estimate* |
| **Unknown** | Words, in italic `ink-dim`: *not stated*, *not logged*. Never a zero, never a dash. Inside a row's detail, which is one run of text, the words are plain, as the rest of it: *Estimate, protein not stated* |
| **Zero, and known** | A figure like any other |

**A total takes the surest kind in it.** One weighed entry makes the day's calories solid; a day of estimates alone is set as one, and says *about*. A protein total that some entry does not state says *at least*, and one that no entry states is *not stated*. **An empty day is 0 kcal and 0 g**, which are known, with *Nothing logged yet* and a way to log.

**Grams** have their thousands apart by a comma, `1,500 g`, and calories do not, `4410 kcal`, but in the day's tally, `3 entries · 1,425 kcal`, as the reference app has it; whatever the phone's language.

**An entry's row** has its calories at the right and its grams and protein under its name.

**A figure and its unit are joined by a no-break space.** Android can break the line at an ordinary one and clip the second half: "0 kcal" was drawn as "0".

## Type

**B612**, drawn for cockpit displays. Its digits are one width, so a changing figure does not move. It is tall: **a line height is at least 1.2 times its size for a figure and 1.5 for text, 1.6 in bold**, or descenders clip at the largest text size. React Native picks a face by family name, so each face is its own token.

Figure sizes never scale with the user's text size; everything else scales to double ([`0007`](./docs/adr/0007-figures-are-fixed-size-and-text-scales-to-double.md)).

**A row reflows.** Name and figure stand side by side while both fit, and the figure drops below the name when they do not: the name keeps `min-w-name`. Nothing holding text has a fixed height, and nothing that matters ends in an ellipsis. Text at double is the largest it is checked at.

## Controls

A primary action is `ink` filled, a secondary one is outlined. No hue. The platform's own component comes first ([`0005`](./docs/adr/0005-styling-is-nativewind-and-components-are-copied-in.md)). A button names what it does: *Log entry*, *Save food*, *Delete*, never *OK* or *Done*.

A target is at least 44pt on iOS and 48dp on Android, each platform's own floor, in one token: `min-h-target min-w-target`.

## Navigation

**Five tabs: Today, Log, Review, Foods, Profile**, in the system's own bar, and no *More*. Five is the most either platform takes, and a More tab hides what it holds. A tab goes to a page and never performs an action. A tab arrives with its content: there is no empty one.

## Asking and telling

| When | What | Not |
| --- | --- | --- |
| A form (grams, an estimate, a food) | A full-height page with *Cancel*. Add food is presented as a full-height modal (the user's word, 26 November 2026, on #27) | A sheet |
| Deleting | The system's own question, naming what goes, answered *Delete* or *Cancel*: an action sheet on iOS, a dialog on Android | A question drawn by us |
| Leaving a full-height form with something typed | The same question, answered *Discard* or *Cancel*, on every way out. A form of up to three fields does not ask, and neither does a form left as it opened | A silent loss of six fields |
| It worked, and the page shows it (a row goes, a row appears) | Nothing | A message repeating it |
| It worked, and the result is on another page (an entry logged) | A line at the top of the page, announced by a screen reader. It stays until the next replaces it or the page is left | A toast, a timer, a haptic |
| It failed | Words above the button, the form still open and filled, and the button tries again | A message that goes away |

**Not a sheet, even for one field.** It was tried for grams. Over Android's own keypad, at 320dp with text at double, a food whose name is five lines left *Log entry* touching the keypad, and one fault beside the field put it out of reach under it. A sheet the height of its contents has nowhere to scroll, and a name is not cut short ([`0007`](./docs/adr/0007-figures-are-fixed-size-and-text-scales-to-double.md)). A page scrolls, with its button outside what scrolls.

**No toasts.** iOS has none, and a message on a timer is gone before someone slow to look has read it.

**The keyboard never hides** the field being typed in or the button that commits it: a form that scrolls makes room for it, with its button and what it says above the button outside what scrolls.

**Focus:** a form of one field takes focus as it opens. A longer one does not, so the whole of it is seen first.

**A failure takes no hue.** Red is a day over its budget. An absence is never a modal.
