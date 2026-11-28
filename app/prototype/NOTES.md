# PROTOTYPE — telling a suspended deficit (throwaway)

**Question:** how Today and Profile's goal card say that the Goal's deficit is suspended (CONTEXT.md, *Suspended Deficit*): the budget is the full maintenance because the Goal's rate asks more of a deficit than maintenance can give. Trim has no look for a standing note on the day's targets: red with a warning sign means a fault, *needs you* (DESIGN.md, *Asking and telling*), and colour is only where the day stands against its targets. Not in question: the rule (#131, kept in epic 2 by the user on 28 November 2026), the words, which are the reference app's (*No deficit is being applied*, its paragraph, *Ease your goal* to Profile), MacroPilot for its name.
**Run:** design page › **Suspended deficit prototype**, or `macropilot://prototype/suspended?variant=A` (`A` | `B` | `C`).
**Variants:**
- **A — a card above the ring.** Its own card on `surface`: a pause sign in `ink-mid`, the title, the paragraph, and *Ease your goal* as a secondary button.
- **B — a note in the ring card.** Under the protein words: the pause sign beside the title and paragraph, then *Ease your goal*.
- **C — a row atop the ring card.** One pressable row, the pause sign, the title and *Your budget is your maintenance. Ease your goal ›*; the paragraph is left out.
- **Profile's goal card** while suspended: A says *1.4 kg a week asks 1540 kcal a day, more than your maintenance of 1535 kcal: no deficit is applied*; B and C put the pause sign before *1.4 kg a week · no deficit applied: your maintenance of 1535 kcal can't carry 1540 kcal a day*.
**The floating bar:** the variant; the page (*Today*, *Profile*); *Hide bar* for a clean photo. The day: a woman of 150 cm and 47 kg, maintenance 1535 kcal, a Goal of 1.4 kg a week (1540 kcal a day), 820 kcal and 61 g of protein logged.
**Settled while grilling:** the rule and its words, from the reference app (`SuspendedDeficitBanner.vue`); the pause sign rather than a warning, in `ink-mid`, so it is neither a fault nor a standing.
**Verdict:**
**Teardown:** `app/prototype/suspended.tsx`, `app/prototype/_layout.tsx`, this file, the link in `app/design.tsx`; then `app/prototype/` is empty, so `exempt.sh off`.
