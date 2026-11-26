# Trim: the design system

Trimming an aircraft is the small correction that holds a course. The app does that with a day's eating, and the weekly review does it with the targets.

The live reference is `app/design.tsx`, on the Developer tab. **If this file and that page disagree, the page is wrong.** The thesis, the rings and the typeface were settled in epic 1 and read on an iPhone in dark. The palette, the page's structure, forms, lists, buttons and the ways of asking and telling were settled on 26 November 2026 (#51), each chosen by the user on the phone from variants built side by side.

## Thesis

> **Food has no colour. Colour is only where your day stands against its targets, and how a thing you did fared.**

The reading condition: a kitchen, one hand, a few seconds, about ten times a day, in bright light or at night. The question each time is *where does my day stand?*

**No food is good or bad; only the day earns a verdict.** A palette that lends a food a hue will sooner or later lend it an opinion. Here it cannot: no food, control, heading or macro carries a hue.

**A field or an action is not a day.** A value typed wrongly, a save that failed, a delete refused: these take red, and a field that is right and an entry logged take green (decided 26 November 2026). This is the platforms' own convention for validation, not a judgement of what was eaten, and it is never the only signal: a fault carries a warning sign and its words, a success a tick.

## The axes

| Axis | Owns | Never |
| --- | --- | --- |
| **Identity: ink and ground** | Text, figures, food, controls, navigation | Expresses a verdict |
| **Standing: `within`, `slightly-over`, `over`** | The rings' arcs, a day's verdict, what is drawn against a target | A button, a link, a heading, a food, a macro |
| **Outcome: `valid`, `fault`** | A field's state, a failure's words and sign, the tick of something done | A button, a heading, a food, a day |

**Grounds** are neutral with a cool pine tint: `ground`, `surface` (a card), `surface-lift` (a thing on a card, such as a field), `line`. **Inks** are `ink`, `ink-mid`, and `ink-dim` for a stated absence. The tint is the palette's character: it was chosen over epic 1's warm greys, over a neutral grey after the iOS Health app, and over a teal tuned to the pine.

**The standing hues are a ladder**: `within` (emerald), `slightly-over` (amber), `over` (red). In dark the red is clearly darker than the other two, so *over* is seen without its hue. Emerald was chosen over teal though green beside red is the pair most often confused: red stays the darkest in dark, and **every verdict is also words**.

**The outcome hues** share their values with `within` and `over` for now. They are separate tokens so that a field and a day can part later without touching either.

Both appearances are in `design-tokens.js`, and every text pair is held to WCAG 4.5:1 in both by `tests/tokenContrast.test.ts`. `ink-dim` was darkened from the palette's first values to pass it, and `ink-mid` moved away from it, so that a stated absence is told from secondary text by more than its italics: the two are held at least 1.4:1 apart, as epic 1's were.

## Signature: the rings

**The full circle is the target.** The day is two arcs: calories outside and thick, protein inside and thin. They are told apart by place, width and name, never by hue, so **protein's standing is also in words**, on the card and in what a screen reader hears. The goal is one arc. The arc takes the hue of where it stands; its track is `line`. Its ends are round, and flat once the gap left is too small for round ones, which would meet and read as a fault. **An empty day is an empty track**, not a missing ring, and no arc is drawn at all: a round cap on nothing draws a dot.

The figure in the centre is `ink` while the day is within its budget, `slightly-over` past it and `over` past the tolerance: the arc and the figure say one thing. It is the one figure that takes a hue, because it is the day's standing and not a food's. The goal's is always `ink`.

Where the rings stand on Today is epic 2's to settle (#6).

## Pages

**The system draws a page's title.** On iOS it is the large title, set in B612, clear over the page and collapsing into a glass bar as the page scrolls under it, as the Health app's. On Android it is the small top app bar: React Native's navigation has no Material large top app bar. Each tab is a stack so that it has a header. iOS ties the large title to the scroll only when the scroll view is the screen's first view, so a page's scroll view is its root. The colours of the header are given as values, from the palette in force; a colour of ours on iOS's bar makes it opaque, so it is given none there.

**A list's rows stand in one card**, under the section's heading, as the Health app's sections: `surface` on `ground`, hairlines between the rows inside it. A card's corner is **20** (`rounded-card`), chosen over 14 and Health's 26, which pinches the ends of short rows.

**Margins are 16 and spacing keeps an 8 grid** (`px-page`, `gap-grid-1`, `gap-grid-2`, `gap-grid-3`). They are px tokens, as the touch target is, because NativeWind's rem is 14 on a phone: `px-4` measured 14.1dp and put every gap off the grid.

**A section's heading** is bold body in `ink`, and a tally beside it in `ink-mid` with its calories set as a figure: *4 entries · **1,320 kcal***. The calories take the surest kind in them, as any total does (*Figures*).

## Figures

| A figure that is | Is set |
| --- | --- |
| **Weighed** | Solid: B612 Bold, `ink` |
| **Estimated** | Lighter: B612 Regular, `ink-mid`, and says *about* or *estimate* |
| **Unknown** | Words, in italic `ink-dim`: *not stated*, *not logged*. Never a zero, never a dash. Inside a row's detail, which is one run of text, the words are plain, as the rest of it: *Estimate, protein not stated* |
| **Zero, and known** | A figure like any other |

**A total takes the surest kind in it.** One weighed entry makes the day's calories solid; a day of estimates alone is set as one, and says *about*. A protein total that some entry does not state says *at least*, and one that no entry states is *not stated*. **An empty day is 0 kcal and 0 g**, which are known.

**Grams** have their thousands apart by a comma, `1,500 g`, and calories do not, `4410 kcal`, but in the day's tally, `3 entries · 1,425 kcal`, as the reference app has it; whatever the phone's language.

**An entry's row** has its calories at the right and its grams and protein under its name.

**A figure and its unit are joined by a no-break space.** Android can break the line at an ordinary one and clip the second half: "0 kcal" was drawn as "0". In code it is written `\u00a0`, or comes from `figures.ts`, never typed as the character: one typed was lost unseen in a rewrite of its line, and `no-irregular-whitespace` refuses it.

**A name is shown in sentence case**, whatever case it was typed in (`shownName`): *COFFEE* is *Coffee*, *Big COFFee* is *Big coffee*. A word with a digit stays as typed, and so does an initialism of up to three letters where the rest of the name is not shouted (*UHT milk*). What was typed is what is kept.

## Type

**B612**, drawn for cockpit displays. Its digits are one width, so a changing figure does not move. It is tall: **a line height is at least 1.2 times its size for a figure and 1.5 for text, 1.6 in bold**, or descenders clip at the largest text size. React Native picks a face by family name, so each face is its own token.

**Body is each platform's own: 17 on iOS, Apple's default, and 16 on Android**, Material's.

Figure sizes never scale with the user's text size; everything else scales to double ([`0007`](./docs/adr/0007-figures-are-fixed-size-and-text-scales-to-double.md)).

**A row reflows.** Name and figure stand side by side while both fit, and the figure drops below the name when they do not: the name keeps `min-w-name`. In a card the row is narrower, so `min-w-name` is measured again there, from the longest word of a name at double. Nothing holding text has a fixed height, and nothing that matters ends in an ellipsis. Text at double is the largest it is checked at. A two-line row is at least 72dp tall on Android (`min-h-two-line`), Material's list item.

## Controls

A primary action is `ink` filled, a secondary one **outlined in `ink`**. No hue. A tonal secondary, filled with `surface-lift`, was tried and refused: on the ground in light it is barely told from the page, short of the 3:1 a control's edge needs. The platform's own component comes first ([`0005`](./docs/adr/0005-styling-is-nativewind-and-components-are-copied-in.md)). A button names what it does: *Log entry*, *Save food*, *Delete*, never *OK* or *Done*.

**Every button shows the platform's press**: iOS dims it, Android ripples. A press that shows nothing leaves a person unsure the tap landed.

A target is at least 44pt on iOS and 48dp on Android, each platform's own floor, in one token: `min-h-target min-w-target`.

## Lists and rows

**A row is deleted by a quiet bin at its end**, in `ink-mid` (SF Symbols' `trash`, Material's `delete`), heard as *Delete <name>*, with a full target: quiet so that it stands back from the figures, which are what Today is read for. **Beside it, a swipe to the left** shows *Delete* in red, as iOS's own lists, the quicker way for whoever knows it. The swiped button reaches the card's rounded edge. Either asks the system's question (*Asking and telling*).

**The rest of a long day is asked for by the card's own last row**: *Show all 5* in bold `ink` with a chevron in `ink-mid`, after a hairline, turning to *Show less*, as the Health app's *Show All Data*. It belongs to the list it opens, and the page keeps one full-width button.

**An empty list under a summary is one line in the list's own card**, with its way on at the right: *Log a weighed food, or an estimate.* · *Log*. The summary above it already says the day is empty, so the line does not say it again. **A page with nothing else on it** (an empty Foods, Log with no foods) takes the quiet empty state: centred, a sign in `ink-mid`, a bold line, a detail and an outlined button, as the Health app's *No Data* and Material's empty state.

## Forms

**A form opens the platform's way, and every form the same way**: on iOS the page sheet (`presentation: 'modal'`), full height, scrolling, the page behind it just seen at its top; on Android a page rising over the last, Material's full-screen dialog. This replaced epic 1's mix of pushed pages and a full-screen modal.

**The way out is an X at the top left**: on iOS the system's own round glass X, heard as *Cancel*, as Apple's own sheets have it since iOS 26; on Android Material's close X. A button of ours on iOS 26's bar is wrapped in a glass pill that does not fit it. The X stays though iOS's sheet can be swiped away: a swipe is unseen, out of reach for VoiceOver and Switch Control, and refused once something is typed.

**A form's button stays at its foot**, full width, outside what scrolls, not in the header as iOS's *Add* and Material's *Save* are: within the thumb's reach, never under the keyboard, the form's fault just above it, and named for what it does (*Log estimated entry*), which a bar's single word cannot be.

**A form's fields stand in one card.** Each has its label above it in `ink-mid`, and the field on `surface-lift`. **A field at fault** is outlined in `fault`, filled with a tint of it, and carries a warning sign at its end; its words are in `fault` **above the field**, under the label. **A valid field** is outlined in `valid` with a tint of it and a tick. Words above, though Material and iOS put them below: a form keeps the field at fault in view when it scrolls to it, and words under it can lie behind the keyboard.

**A field is judged once it is left, then again as it is typed**, so a red one turns green the moment it is fixed: React Hook Form's `mode: 'onTouched'` ([`0009`](./docs/adr/0009-forms-are-react-hook-form-with-zod-and-the-domain-still-judges.md)). Its default, `onSubmit`, would show a tick only beside a red after a refused save. The button still judges the whole form.

**A fault out of view is brought into it.** A form of more than one field scrolls to the first field at fault, and says above its button, in `fault` with its sign, *Not saved. A field above needs changing.*, since on a phone the fault can be off the screen. `forms/first-fault-shown` refuses such a form without `useFirstFault` and `formFault`.

**The keyboard never hides** the field being typed in or the button that commits it: a form that scrolls makes room for it, with its button and what it says above the button outside what scrolls.

**Focus:** a form of one field takes focus as it opens. A longer one does not, so the whole of it is seen first.

## Navigation

**Five tabs: Today, Log, Review, Foods, Profile**, in the system's own bar, and no *More*. Five is the most either platform takes, and a More tab hides what it holds. A tab goes to a page and never performs an action. A tab arrives with its content: there is no empty one.

## Asking and telling

| When | What | Not |
| --- | --- | --- |
| A form (grams, an estimate, a food) | iOS's page sheet, Android's full-screen page, with an X (*Forms*) | A sheet the height of its contents |
| Deleting | The system's own question, naming what goes, answered *Delete* or *Cancel*: an action sheet on iOS, a dialog on Android, in sentence case there as Material 3 has it | A question drawn by us |
| Leaving a form with something typed | The same question, answered *Discard* or *Cancel*, on every way out, a swipe on the sheet included. A form of up to three fields does not ask, and neither does a form left as it opened | A silent loss of six fields |
| It worked, and the page shows it (a row goes, a row appears) | Nothing | A message repeating it |
| It worked, and the result is on another page (an entry logged) | A card at the top of the page with a tick in `valid`, announced by a screen reader. It stays until the next replaces it or the page is left | A toast, a timer, a haptic |
| It failed | Words in `fault` with the warning sign, where it happened: above a form's button, the form still open and filled, the button trying again; above a row whose delete failed; in place of a page that cannot be read, with *Retry* | A message that goes away |

**Not a sheet the height of its contents, even for one field.** It was tried for grams. Over Android's own keypad, at 320dp with text at double, a food whose name is five lines left *Log entry* touching the keypad, and one fault beside the field put it out of reach under it. A sheet the height of its contents has nowhere to scroll, and a name is not cut short ([`0007`](./docs/adr/0007-figures-are-fixed-size-and-text-scales-to-double.md)). iOS's page sheet is full height and scrolls, with its button outside what scrolls, so it is not that.

**No toasts.** iOS has none, and a message on a timer is gone before someone slow to look has read it.

**Green with a tick is *done*; red with a warning is *needs you*.** That pair means the same everywhere it appears.

**Loading:** a page shows nothing before its first read, which is quick; a placeholder is earned only by a read measured slow.

**An absence is never a modal.**
