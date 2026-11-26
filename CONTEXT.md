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

## Relationships

- A **Weighed Entry** is of exactly one **Food**; an **Estimated Entry** is of none.
- A **Daily Log** holds the **Entries** of one day, oldest first.
- A day's **Calories** are the sum of its Entries', weighed and estimated alike.

## Example dialogue

> **Dev:** "The pub lunch has no protein figure. Is the day's protein 66 g?"
> **Domain expert:** "It is *at least* 66 g. The lunch had some; nobody said how much."
> **Dev:** "And a black coffee, weighed, with 0 g?"
> **Domain expert:** "That one is stated. It is 0, and it does not make the day 'at least' anything."
