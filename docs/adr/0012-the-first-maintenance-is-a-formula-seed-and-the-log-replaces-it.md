# The first maintenance is a formula seed, and the log replaces it

The app exists to discover, from what the user logs and weighs, how much they really burn. The first **Weekly Review** has no history yet, so it needs a starting point. The question this answers is how good that starting point should try to be.

## The decision

**The first Weekly Review's maintenance is the Mifflin-St Jeor basal rate times a fixed 1.4.** The basal rate is `10 × Trend Weight kg + 6.25 × height cm − 5 × age`, plus 5 for a man and less 161 for a woman, with age in whole years on the review's date. There is no activity level, no body-fat figure, and no other equation. Epic 3's adaptive maintenance replaces the seed once there are two weeks of log and weigh-ins.

## Why

- **Mifflin-St Jeor is still the most accurate equation that uses only sex, age, height and weight.** Validations keep finding it the least biased. One study of 130 adults found it within 10% of measured for 78%. A 2023 meta-analysis found it least biased after bariatric surgery, and a 2025 cohort found it most accurate among young women. It is less accurate for obese and older adults, but so is every equation.
- **The activity factor is where the error is, and no question fixes it.** Doubly-labelled-water studies put free-living adults near 1.65 times their basal rate, give or take about 0.3 for an individual. That spread is wider than the gap between any two basal equations. People tend to overrate how active they are, so an activity question would put false precision into the figure that matters most.
- **1.4 errs low.** On a weight-loss Goal, a budget set too low loses weight a little faster than asked; one set too high stalls it. The low error is the one a user notices least and the log corrects.
- **The seed is temporary by design.** What is logged and weighed is better evidence of a person's maintenance than any equation, and epic 3's review learns it from that. Effort spent on a better seed buys at most two weeks.

## Alternatives rejected

- **An activity level on the Profile** (sedentary 1.2 to very active 1.9). It is the usual calculator's question. It is rejected for false precision and for one more field that nobody revisits once the log has taken over.
- **Cunningham or Katch-McArdle, from lean mass.** They need a body-fat percentage. A bathroom scale's figure is noisy, and in a head-to-head comparison Cunningham came within 10% for 35% of people against Mifflin's 60%.
- **Harris-Benedict.** It is older, and it overestimates more than Mifflin-St Jeor in most of the comparisons.

## Consequences

- A user whose real maintenance is far from the seed sees a budget change at epic 3's first adaptive review. The budget-change banner is how that is told.
- Changing height or birth date does not re-run the review. They are set once, and the seed matters only until the log replaces it.
