# PROTOTYPE — the line when an entry would pass the budget (throwaway)

**Question:** how the grams page's live line looks above *Log entry*. Not in question: that it never blocks and is one tap (grilling, Q11), its words, that it is a standing and not a fault.
**Run:** design page › **Over line prototype**, or `macropilot://prototype/over-line?variant=A` (`A` | `B`).
**Variants:** **A — words only**, in the standing's hue: *slightly over* within the tolerance, *over* past it. **B — words and a mark**, a dot in the same hue before them.
**The floating bar:** the variant; the grams (*Under budget*, no line; *Slightly over*; *Over the tolerance*). Typing in the field moves the line live. Text at double is the user's to check.
**Settled while grilling:** shown only while the day's calories with this entry would pass the budget; *This puts you about 135 kcal over your 1840 kcal budget.*; not announced on each keystroke.
**Decided here without the grilling:** the line is bold body, as `Failure`'s words are. The page has no `KeyboardAvoidingView` (`forms/form-page` allows it only in `FormPage`, which has no place for the line), so the field does not take focus as it opens and the keyboard may cover the foot: judge with it put away.
**Verdict (27 Nov 2026):** **B** — the words and a dot before them, both in the standing's hue. Chosen by the user on the iPhone.
**Teardown:** `app/prototype/over-line.tsx`, its link in `app/design.tsx`, this section; then `app/prototype/` is empty, so `_layout.tsx` goes and `exempt.sh off`.
