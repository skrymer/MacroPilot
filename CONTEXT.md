# MacroPilot

A personal macro and calorie tracker. One person, on one phone, logs what they eat and sees where their day stands.

This is the ubiquitous language: use these words in code, tests, issues and on screen. Terms are added as they are settled.

## Language

### Food

**Food**:
A reusable definition of something edible: a name and its **Macros** per 100 g.
_Avoid_: product, item, ingredient (a role a Food plays in a recipe)

**Macros**:
Protein, carbohydrate, fat, fibre and alcohol, in grams per 100 g of a **Food**; the first three are always stated, and fibre and alcohol may be **Not stated**.
_Avoid_: nutrients, nutrition facts

**Carbohydrate**:
Available carbohydrate, with fibre excluded.
_Avoid_: total carbs, net carbs

**Calories**:
A Food's energy in kcal, always derived from its Macros and never entered: 4 per gram of protein and of carbohydrate, 9 of fat, 2 of fibre, 7 of alcohol. A **Not stated** figure contributes none.
_Avoid_: energy, kJ

**ABV**:
Alcohol in percent by volume, as a label gives it. It is how alcohol is written and read; what is kept is grams per 100 g, at 0.789 g to the percent.

**Not stated**:
A figure nobody gave. It is never zero: zero is a figure someone gave.
_Avoid_: unknown, missing, empty, N/A

### Log

**Entry**:
One occasion of eating, on one day: a **Weighed Entry** or an **Estimated Entry**. Its figures are taken when it is logged and do not change when its Food does.
_Avoid_: log (the verb is fine), record, meal

**Weighed Entry**:
An Entry of a Food and the grams of it eaten, its calories and protein computed from the Food.

**Estimated Entry**:
An Entry of something that could not be weighed: a label and calories, at least 1, and protein where the user gave it. It has no Food and no grams.
_Avoid_: guess, quick add

**Entry's name**:
What the user knows an Entry by: its Food's name now, or its own label.

**Daily Log**:
One day's Entries and what they total.
_Avoid_: diary, journal

**Known protein**:
The protein of the day's Entries that state it, with whether every Entry did. Where one did not it is *at least* that much; where none did it is **Not stated**; a day with no Entries has 0 g.
_Avoid_: total protein

### Targets

**Profile**:
What the targets are worked out from: sex, birth date and height in cm, and whether the user counts calories (on unless they say otherwise).
_Avoid_: account, settings, user details

**Weigh-in**:
The user's weight on one day, 20 to 400 kg. A day has at most one; weighing in again that day replaces it.
_Avoid_: measurement, reading

**Trend Weight**:
The user's weight with the day-to-day noise smoothed out: the first **Weigh-in**, then moved toward each later one, 10% of the way for every day since the last, compounding. It, not the latest Weigh-in, is what targets are set from.
_Avoid_: average weight, smoothed weight

**Goal**:
A target weight below the **Trend Weight** and a rate of loss in kg a week, 0.05 to 1.5. It starts from the Trend Weight when it is set, and asks a daily deficit of rate × 7700 ÷ 7 kcal. There is one at a time; setting another replaces it. Without one, the **Calorie Budget** is maintenance.
_Avoid_: target (alone), plan

**Setup**:
Complete once there is a **Profile** and at least one **Weigh-in**. Until then there is no **Weekly Review**, so no **Calorie Budget** and no **Protein Floor**.

**Weekly Review**:
The dated decision of what a day's targets are: a **Calorie Budget** and a **Protein Floor**, with the **Trend Weight** they were set from. A day is held to the latest Weekly Review dated on or before it, and keeps it when a later one changes the targets.
_Avoid_: recalculation, check-in

**Calorie Budget**:
The kcal a day may take: maintenance less the **Goal**'s daily deficit.
_Avoid_: limit, allowance, target calories

**Protein Floor**:
The protein a day should reach at least: 2 g per kg of **Trend Weight**.
_Avoid_: protein target, protein goal

**Tolerance**:
How far past its **Calorie Budget** a day may go and be only *slightly over*: 10%.

**Day's verdict**:
Where a day stands against its targets, in words: *Over budget* past the **Tolerance**, *Slightly over* past the budget, otherwise *On target* once **Known protein** reaches the **Protein Floor** and *In progress* until then. Protein that is *at least* enough is enough; protein **Not stated** is not yet. A day has no verdict before **Setup**.

**Formula seed**:
How the first **Weekly Review** sets maintenance before there is a history to learn from: the basal rate from the **Profile** and the **Trend Weight**, times a fixed 1.4.

## Relationships

- A **Weighed Entry** is of exactly one **Food**; an **Estimated Entry** is of none.
- A **Daily Log** holds the **Entries** of one day, oldest first.
- A day's **Calories** are the sum of its Entries', weighed and estimated alike.

## Example dialogue

> **Dev:** "The pub lunch has no protein figure. Is the day's protein 66 g?"
> **Domain expert:** "It is *at least* 66 g. The lunch had some; nobody said how much."
> **Dev:** "And a black coffee, weighed, with 0 g?"
> **Domain expert:** "That one is stated. It is 0, and it does not make the day 'at least' anything."
