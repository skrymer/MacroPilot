# PROTOTYPE — the Profile tab (throwaway)

**Question:** how the Profile tab reads in each of its states, and whether a goal is set from a form on the page or behind a button. Not in question: the fields and their rules (CONTEXT.md, *Profile*, *Goal*, *Weigh-in*), that Profile is a tab (DESIGN.md, *Navigation*), how a form opens (DESIGN.md, *Forms*).
**Run:** design page › **Profile prototype**, or `macropilot://prototype/profile?variant=A` (`A` | `B`).
**Variants:** **A — the goal form inline** in the goal card when there is no goal. **B — behind a button**, *Set a goal*, which opens the goal form.
**The floating bar:** the variant; the page (*Not filled*, *Before Setup*, *No goal*, *Goal set*) and the forms (*Details form*, *Goal form*, *Goal refused*, *Weight form*, *Weight refused*); *Hide bar*. The forms are drawn on the page with Trim's card and foot button, not presented as sheets: how a form opens is settled.
**Settled while grilling:** page order goal card, then *Your details*; the goal asks for Setup; the details form has Sex, Birth date (the platform's own picker), Height and Calorie tracking; the goal form shows the start weight as the trend and refuses a rate that outruns maintenance; a weigh-in is 20 to 400 kg.
**Decided here without the grilling:** the not-filled state's words (*No details yet*, *Your sex, birth date and height set your first calorie budget and protein floor.*) and a person sign, which `Notice` cannot show yet (its sign is fixed); the details are changed by an outlined *Change details* under their card; Sex and Calorie tracking are segmented choices; the goal set reads *82.4 → 75.0 kg* with *0.5 kg a week, 550 kcal a day under maintenance*; the weigh-in's refusal reads *Enter a weight from 20 to 400 kg*.
**Verdict (27 Nov 2026):** **B** — no goal shows *Set a goal*, which opens the goal form. Chosen by the user on the iPhone.
**Retired in part (27 Nov 2026):** the details half (*Not filled*, *Details form*, *Your details*) is built as the Profile tab and the details form, and is gone from the prototype; the goal form stays until its slice. The weight form is built as Log weight on Today (#128), and is gone from it too.
**Teardown:** `app/prototype/profile.tsx`, its link in `app/design.tsx`, this section.

# PROTOTYPE — the line when an entry would pass the budget (throwaway)

**Question:** how the grams page's live line looks above *Log entry*. Not in question: that it never blocks and is one tap (grilling, Q11), its words, that it is a standing and not a fault.
**Run:** design page › **Over line prototype**, or `macropilot://prototype/over-line?variant=A` (`A` | `B`).
**Variants:** **A — words only**, in the standing's hue: *slightly over* within the tolerance, *over* past it. **B — words and a mark**, a dot in the same hue before them.
**The floating bar:** the variant; the grams (*Under budget*, no line; *Slightly over*; *Over the tolerance*). Typing in the field moves the line live. Text at double is the user's to check.
**Settled while grilling:** shown only while the day's calories with this entry would pass the budget; *This puts you about 135 kcal over your 1840 kcal budget.*; not announced on each keystroke.
**Decided here without the grilling:** the line is bold body, as `Failure`'s words are. The page has no `KeyboardAvoidingView` (`forms/form-page` allows it only in `FormPage`, which has no place for the line), so the field does not take focus as it opens and the keyboard may cover the foot: judge with it put away.
**Verdict (27 Nov 2026):** **B** — the words and a dot before them, both in the standing's hue. Chosen by the user on the iPhone.
**Teardown:** `app/prototype/over-line.tsx`, its link in `app/design.tsx`, this section; then `app/prototype/` is empty, so `_layout.tsx` goes and `exempt.sh off`.
