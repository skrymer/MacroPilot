import { act, fireEvent, screen, userEvent, within } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { ScriptedAsk } from '@/components/ScriptedAsk';
import { TestProviders } from '@/components/TestProviders';
import { Text } from '@/components/Text';
import { estimatedEntry, weighedEntry } from '@/domain/entry';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { InMemoryEntryStore } from '@/storage/InMemoryEntryStore';
import { InMemoryProfileStore } from '@/storage/InMemoryProfileStore';
import { InMemoryReviewStore } from '@/storage/InMemoryReviewStore';
import { InMemoryWeighInStore } from '@/storage/InMemoryWeighInStore';

import Today from './index';

const OATS = { id: 1, name: 'rolled OATS', macros: { protein: 13, carbohydrate: 20, fat: 18 } };
const COFFEE = { id: 2, name: 'coffee', macros: { protein: 0, carbohydrate: 0, fat: 0 } };

/** Noon on 24 November 2026, on a phone in UTC. */
const atNoon = () => {
  const clock = new ScriptedClock();
  clock.advance(Date.UTC(2026, 10, 24, 12));
  return clock;
};

/** Estimates of 100 kcal each on the 24th, under those labels. */
const withLunches = async (...labels: string[]) => {
  const entries = new InMemoryEntryStore();
  for (const label of labels) {
    await entries.add(estimatedEntry({ label, calories: 100 }, '2026-11-24'));
  }
  return entries;
};

/** Opens the app on Today, over `entries`. */
const openToday = (
  entries: InMemoryEntryStore,
  clock = atNoon(),
  ask?: ScriptedAsk,
  weighIns?: InMemoryWeighInStore,
  profile?: InMemoryProfileStore,
  reviews?: InMemoryReviewStore,
) =>
  renderRouter(
    {
      '(tabs)/(today)/index': Today,
      '(tabs)/(log)/log': () => null,
      '(tabs)/(profile)/profile': () => <Text>Profile, as the tab shows it</Text>,
    },
    {
      initialUrl: '/',
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders
          clock={clock}
          entries={entries}
          ask={ask}
          weighIns={weighIns}
          profile={profile}
          reviews={reviews}
        >
          {children}
        </TestProviders>
      ),
    },
  );

/** Deletes an entry the way a screen reader does, in place of the swipe: the row's Delete action. */
const deleteFrom = async (row: string | RegExp) => {
  const found = await screen.findByLabelText(row);
  await act(async () => {
    fireEvent(found, 'accessibilityAction', { nativeEvent: { actionName: 'delete' } });
  });
};

describe('Today before Setup', () => {
  it.each([
    [false, false, 'Add your details and log your weight to see your calorie budget', 'Profile'],
    [false, true, 'Add your details to see your calorie budget', 'Profile'],
    [true, false, 'Log your weight to see your calorie budget', 'Log weight'],
  ])(
    'names what is missing (a profile: %s, a weigh-in: %s), and the way to it',
    async (hasProfile, hasWeighIn, words, action) => {
      // Given a phone with or without a profile and a weigh-in
      const profile = new InMemoryProfileStore();
      if (hasProfile) {
        await profile.save({
          sex: 'male',
          born: '1984-03-14',
          heightCm: 181,
          countsCalories: true,
        });
      }
      const weighIns = new InMemoryWeighInStore();
      if (hasWeighIn) await weighIns.save({ day: '2026-11-23', kg: 82 });

      // When the user opens Today
      await openToday(new InMemoryEntryStore(), atNoon(), undefined, weighIns, profile);

      // Then the setup line says what is missing, with its way on
      expect(await screen.findByText(words)).toBeOnTheScreen();
      expect(screen.getAllByRole('button', { name: action })[0]).toBeOnTheScreen();
    },
  );
});

describe('Today’s setup line', () => {
  it('takes the user to Profile for the details', async () => {
    // Given Today with nothing set up
    await openToday(new InMemoryEntryStore(), atNoon(), undefined, new InMemoryWeighInStore());

    // When the user presses the setup line's Profile
    await userEvent.press(await screen.findByRole('button', { name: 'Profile' }));

    // Then Profile is showing
    expect(await screen.findByText('Profile, as the tab shows it')).toBeOnTheScreen();
  });
});

describe('Today’s ring', () => {
  it('says the kcal left and the day’s verdict once the day is held to a review', async () => {
    // Given a review of 2000 kcal and 150 g on the 24th, and 400 g of oats (1176 kcal) logged that day
    const reviews = new InMemoryReviewStore();
    await reviews.save({
      day: '2026-11-24',
      trendKg: 75,
      maintenanceKcal: 2000,
      budgetKcal: 2000,
      proteinFloorG: 150,
    });
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 400, '2026-11-24'));

    // When the user opens Today
    await openToday(entries, atNoon(), undefined, undefined, undefined, reviews);

    // Then the ring card says what is left, and where the day stands, as one
    expect(await screen.findByLabelText(/^In progress, 824 kcal left/)).toBeOnTheScreen();
    expect(screen.getByText('824')).toBeOnTheScreen();
    expect(screen.getByText('kcal left')).toBeOnTheScreen();
  });
});

describe('Today’s ring past the budget', () => {
  it('says how far over, and over budget past the tolerance', async () => {
    // Given a review of 1000 kcal on the 24th, and 400 g of oats (1176 kcal) logged that day
    const reviews = new InMemoryReviewStore();
    await reviews.save({
      day: '2026-11-24',
      trendKg: 75,
      maintenanceKcal: 1000,
      budgetKcal: 1000,
      proteinFloorG: 150,
    });
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 400, '2026-11-24'));

    // When the user opens Today
    await openToday(entries, atNoon(), undefined, undefined, undefined, reviews);

    // Then it says 176 kcal over, and over budget
    expect(await screen.findByLabelText(/^Over budget, 176 kcal over/)).toBeOnTheScreen();
    expect(screen.getByText('kcal over')).toBeOnTheScreen();
  });
});

describe('Today’s ring on an empty day', () => {
  it('says nothing is logged yet in place of a verdict, with the whole budget left', async () => {
    // Given a review of 2000 kcal on the 24th, and nothing logged that day
    const reviews = new InMemoryReviewStore();
    await reviews.save({
      day: '2026-11-24',
      trendKg: 75,
      maintenanceKcal: 2000,
      budgetKcal: 2000,
      proteinFloorG: 150,
    });

    // When the user opens Today
    await openToday(new InMemoryEntryStore(), atNoon(), undefined, undefined, undefined, reviews);

    // Then it says so, never In progress
    expect(await screen.findByLabelText(/^Nothing logged yet, 2000 kcal left/)).toBeOnTheScreen();
    expect(screen.queryByText('In progress')).not.toBeOnTheScreen();
  });
});

describe('Today’s ring on a day of estimates', () => {
  it('says about over what is left when nothing in the day was weighed', async () => {
    // Given a review of 2000 kcal on the 24th, and two estimates of 100 kcal that day
    const reviews = new InMemoryReviewStore();
    await reviews.save({
      day: '2026-11-24',
      trendKg: 75,
      maintenanceKcal: 2000,
      budgetKcal: 2000,
      proteinFloorG: 150,
    });
    const entries = await withLunches('pub lunch', 'cake');

    // When the user opens Today
    await openToday(entries, atNoon(), undefined, undefined, undefined, reviews);

    // Then the figure is said to be about, as an estimate is
    expect(await screen.findByLabelText(/^In progress, about 1800 kcal left/)).toBeOnTheScreen();
    expect(screen.getByText('about')).toBeOnTheScreen();
  });
});

describe('Today before its first review', () => {
  it('has no ring on a day before the first review, only the totals card', async () => {
    // Given the first review dated the 25th, and Today the 24th
    const reviews = new InMemoryReviewStore();
    await reviews.save({
      day: '2026-11-25',
      trendKg: 75,
      maintenanceKcal: 2000,
      budgetKcal: 2000,
      proteinFloorG: 150,
    });

    // When the user opens Today
    await openToday(new InMemoryEntryStore(), atNoon(), undefined, undefined, undefined, reviews);

    // Then epic 1's totals card stands, never a budget
    expect(await screen.findByLabelText(/today, nothing logged yet$/)).toBeOnTheScreen();
    expect(screen.queryByText('kcal left')).not.toBeOnTheScreen();
  });
});

describe('Today before its reads', () => {
  it('says nothing about setup until the profile has been read', async () => {
    // Given a profile and no weigh-in, the profile's read not come back
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    const release = profile.holdNextRead();

    // When the user opens Today
    await openToday(
      new InMemoryEntryStore(),
      atNoon(),
      undefined,
      new InMemoryWeighInStore(),
      profile,
    );

    // Then no setup line shows until the read is back, and then the one for the weigh-in alone
    expect(await screen.findByText('No weight logged today')).toBeOnTheScreen();
    expect(screen.queryByText(/to see your calorie budget$/)).not.toBeOnTheScreen();
    await act(async () => release());
    expect(await screen.findByText('Log your weight to see your calorie budget')).toBeOnTheScreen();
  });
});

describe('Today after Setup', () => {
  it('says nothing about setup once there are details and a weigh-in', async () => {
    // Given a profile and a weigh-in yesterday
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    const weighIns = new InMemoryWeighInStore();
    await weighIns.save({ day: '2026-11-23', kg: 82 });

    // When the user opens Today
    await openToday(new InMemoryEntryStore(), atNoon(), undefined, weighIns, profile);

    // Then there is no setup line
    expect(await screen.findByText('No weight logged today')).toBeOnTheScreen();
    expect(screen.queryByText(/to see your calorie budget$/)).not.toBeOnTheScreen();
  });
});

describe('Today’s weigh-in', () => {
  it('says no weight is logged today, and offers to log one, as the day card’s last row', async () => {
    // Given a weigh-in yesterday and none today
    const weighIns = new InMemoryWeighInStore();
    await weighIns.save({ day: '2026-11-23', kg: 82 });

    // When the user opens Today
    await openToday(new InMemoryEntryStore(), atNoon(), undefined, weighIns);

    // Then the row says so, with the way to log one
    expect(await screen.findByText('No weight logged today')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Log weight' })).toBeOnTheScreen();
  });

  it('reads no weight logged once midnight has passed, the weigh-in being yesterday’s', async () => {
    // Given Today open at 23:59 with a weigh-in that day
    const weighIns = new InMemoryWeighInStore();
    await weighIns.save({ day: '2026-11-24', kg: 82 });
    const clock = new ScriptedClock();
    clock.advance(Date.UTC(2026, 10, 24, 23, 59));
    await openToday(new InMemoryEntryStore(), clock, undefined, weighIns);
    expect(await screen.findByLabelText('Weight today, 82.0 kilograms')).toBeOnTheScreen();

    // When midnight passes
    await act(async () => clock.advance(2 * 60_000));

    // Then the row says no weight is logged today
    expect(await screen.findByText('No weight logged today')).toBeOnTheScreen();
  });

  it('says the weigh-ins could not be read, and never that none is logged', async () => {
    // Given weigh-ins that cannot be read
    const weighIns = new InMemoryWeighInStore();
    weighIns.unreadable = true;

    // When the user opens Today
    await openToday(new InMemoryEntryStore(), atNoon(), undefined, weighIns);

    // Then the row says so, with the way to try again
    expect(await screen.findByText('Couldn’t load your weight')).toBeOnTheScreen();
    expect(screen.queryByText('No weight logged today')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeOnTheScreen();
  });

  it('shows today’s weight to a tenth of a kilo, read out as one, with the way to change it', async () => {
    // Given a weigh-in of 82 kg today
    const weighIns = new InMemoryWeighInStore();
    await weighIns.save({ day: '2026-11-24', kg: 82 });

    // When the user opens Today
    await openToday(new InMemoryEntryStore(), atNoon(), undefined, weighIns);

    // Then the row says it, and offers to edit it
    expect(await screen.findByLabelText('Weight today, 82.0 kilograms')).toBeOnTheScreen();
    expect(screen.getByText(/^82\.0\skg$/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Edit today’s weight' })).toBeOnTheScreen();
    expect(screen.queryByText('No weight logged today')).not.toBeOnTheScreen();
  });
});

describe('Today', () => {
  it('says what the day adds up to, and what is in it', async () => {
    // Given three entries logged today, and one yesterday
    const entries = new InMemoryEntryStore([OATS, COFFEE]);
    await entries.add(weighedEntry(OATS, 500, '2026-11-23'));
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    await entries.add(weighedEntry(COFFEE, 250, '2026-11-24'));
    await entries.add(weighedEntry(OATS, 20, '2026-11-24'));

    // When the user opens Today
    await openToday(entries);

    // Then the totals are today's sums, and each entry of today has its own figures, zeros too
    const day = await screen.findByLabelText('294 calories, 13 grams of protein today');
    expect(within(day).getByText('294 kcal')).toBeOnTheScreen();
    expect(within(day).getByText('13 g protein')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Rolled oats, 80 grams, 235 calories, 10 grams of protein'),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Coffee, 250 grams, 0 calories, 0 grams of protein'),
    ).toBeOnTheScreen();
    expect(screen.getByText('250 g, 0 g protein')).toBeOnTheScreen();
    expect(screen.getByText('0 kcal')).toBeOnTheScreen();
    expect(screen.getByText('59 kcal')).toBeOnTheScreen();
    expect(screen.queryByText('Nothing logged yet')).not.toBeOnTheScreen();
  });

  it('tells an estimate from a weighed entry, its protein not stated or a figure', async () => {
    // Given a weighed entry, an estimate that states no protein, and one that states 0
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    await entries.add(estimatedEntry({ label: 'pub LUNCH', calories: 850 }, '2026-11-24'));
    await entries.add(estimatedEntry({ label: 'broth', calories: 1, protein: 0 }, '2026-11-24'));

    // When the user opens Today
    await openToday(entries);

    // Then each estimate says it is one, and what it knows of its protein, to the eye and the ear
    expect(await screen.findByText('about 850 kcal')).toBeOnTheScreen();
    expect(screen.getByText('Estimate, protein not stated')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Pub lunch, estimate, about 850 calories, protein not stated'),
    ).toBeOnTheScreen();
    expect(screen.getByText('about 1 kcal')).toBeOnTheScreen();
    expect(screen.getByText('Estimate, 0 g protein')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Broth, estimate, about 1 calorie, 0 grams of protein'),
    ).toBeOnTheScreen();
    expect(screen.getByText('80 g, 10 g protein')).toBeOnTheScreen();
  });

  it.each([
    [
      'estimates alone, none with protein',
      [{ calories: 850 }, { calories: 150 }],
      'about 1000 kcal',
      'protein not stated',
      'About 1000 calories, protein not stated today',
    ],
    [
      'estimates alone, one with protein',
      [{ calories: 850, protein: 30 }, { calories: 150 }],
      'about 1000 kcal',
      'at least 30 g protein',
      'About 1000 calories, at least 30 grams of protein today',
    ],
    [
      'an estimate that states no protein beside one that states none of it',
      [{ calories: 850, protein: 0 }, { calories: 150 }],
      'about 1000 kcal',
      'at least 0 g protein',
      'About 1000 calories, at least 0 grams of protein today',
    ],
    [
      'estimates that all state it',
      [
        { calories: 850, protein: 30 },
        { calories: 150, protein: 0 },
      ],
      'about 1000 kcal',
      '30 g protein',
      'About 1000 calories, 30 grams of protein today',
    ],
  ])('says how sure a day of %s is', async (_, estimates, kcal, protein, spoken) => {
    // Given a day's estimates
    const entries = new InMemoryEntryStore();
    for (const estimate of estimates) {
      await entries.add(estimatedEntry({ label: 'lunch', ...estimate }, '2026-11-24'));
    }

    // When the user opens Today
    await openToday(entries);

    // Then its card says so, to the eye and the ear
    expect(await screen.findByLabelText(spoken)).toBeOnTheScreen();
    expect(screen.getByText(kcal)).toBeOnTheScreen();
    expect(screen.getByText(protein)).toBeOnTheScreen();
  });

  it('takes one weighed entry for a solid total, and protein that an estimate does not state for part', async () => {
    // Given a weighed entry, an estimate with protein and one without
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    await entries.add(estimatedEntry({ label: 'soup', calories: 200, protein: 8 }, '2026-11-24'));
    await entries.add(estimatedEntry({ label: 'lunch', calories: 850 }, '2026-11-24'));

    // When the user opens Today
    await openToday(entries);

    // Then its calories are not *about*, and its protein is *at least*
    expect(
      await screen.findByLabelText('1285 calories, at least 18 grams of protein today'),
    ).toBeOnTheScreen();
    expect(screen.getByText('1285 kcal')).toBeOnTheScreen();
    expect(screen.getByText('at least 18 g protein')).toBeOnTheScreen();
  });

  it('asks about an entry deleted from its row’s actions, as a screen reader does in place of a swipe', async () => {
    // Given Today open on an entry
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    const ask = new ScriptedAsk();
    await openToday(entries, atNoon(), ask);
    const row = await screen.findByLabelText(/^Rolled oats, /);

    // When a screen reader takes the row's Delete action (userEvent has none to take)
    fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'delete' } });

    // Then the system asks about that entry
    expect(row).toHaveProp('accessibilityActions', [{ name: 'delete', label: 'Delete' }]);
    expect(ask.question?.title).toBe('Delete this entry?');
  });

  it('deletes the entry it asked about by its figures, and the totals follow', async () => {
    // Given Today open on two entries of one food, and the first asked to be deleted
    const entries = new InMemoryEntryStore([OATS]);
    for (const eaten of [80, 20]) {
      await entries.add(weighedEntry(OATS, eaten, '2026-11-24'));
    }
    const ask = new ScriptedAsk();
    await openToday(entries, atNoon(), ask);
    await deleteFrom('Rolled oats, 80 grams, 235 calories, 10 grams of protein');
    const { title, message, loses } = ask.question ?? {};
    expect([title, loses]).toEqual(['Delete this entry?', 'Delete']);
    // A figure and its unit are joined by a no-break space.
    expect(message?.replace(/\s/g, ' ')).toBe(
      'Rolled oats, 80 g, 235 kcal, 10 g protein will be removed, and that day’s totals re-derive without it.',
    );

    // When the user says to
    await act(async () => ask.answer(true));

    // Then it alone is gone, and the day is what is left
    expect(await screen.findByText('20 g, 3 g protein')).toBeOnTheScreen();
    expect(screen.queryByText('80 g, 10 g protein')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('59 calories, 3 grams of protein today')).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
    expect(await entries.listOn('2026-11-24')).toHaveLength(1);
  });

  it('keeps an entry whose question is cancelled, an estimate asked about without the protein it does not state', async () => {
    // Given Today open on an estimate, asked to be deleted
    const entries = new InMemoryEntryStore();
    await entries.add(estimatedEntry({ label: 'pub lunch', calories: 850 }, '2026-11-24'));
    const ask = new ScriptedAsk();
    await openToday(entries, atNoon(), ask);
    await deleteFrom(/^Pub lunch, /);
    expect(ask.question?.message?.replace(/\s/g, ' ')).toMatch(
      /^Pub lunch, about 850 kcal will be removed/,
    );

    // When the user cancels
    await act(async () => ask.answer(false));

    // Then it is there
    expect(screen.getByText('Pub lunch')).toBeOnTheScreen();
    expect(await entries.listOn('2026-11-24')).toHaveLength(1);
  });

  it('leaves an entry whose delete fails, says so over its name, and is an empty day once it works', async () => {
    // Given Today open on one estimate whose delete failed, and now can be written
    const entries = new InMemoryEntryStore();
    await entries.add(estimatedEntry({ label: 'pub lunch', calories: 850 }, '2026-11-24'));
    entries.unwritable = true;
    const ask = new ScriptedAsk();
    await openToday(entries, atNoon(), ask);
    await deleteFrom(/^Pub lunch, /);
    await act(async () => ask.answer(true));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete entry');
    const met = await screen.findAllByText(/^(Could not delete entry|Pub lunch)$/);
    expect(met.map((text) => text.children[0])).toEqual(['Could not delete entry', 'Pub lunch']);
    entries.unwritable = false;
    await deleteFrom(/^Pub lunch, /);
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();

    // When the user says to delete it again
    await act(async () => ask.answer(true));

    // Then the day is an empty one, its zeros known
    expect(await screen.findByText('Nothing logged yet')).toBeOnTheScreen();
    expect(screen.getByText('0 kcal')).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });

  it('moves on at the phone’s midnight, with yesterday’s entries off it', async () => {
    // Given a phone ten hours ahead of UTC with Today open at its 23:59, and an entry on either day
    const clock = new ScriptedClock();
    clock.setUtcOffset(600);
    clock.advance(Date.UTC(2026, 10, 24, 13, 59));
    const entries = new InMemoryEntryStore([OATS, COFFEE]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    await entries.add(weighedEntry(COFFEE, 250, '2026-11-25'));
    await openToday(entries, clock);
    expect(await screen.findByText('Rolled oats')).toBeOnTheScreen();

    // When midnight comes there, which in UTC it is not
    await act(async () => clock.advance(60_000));

    // Then the day is the new one, and what was eaten yesterday is not on it
    expect(await screen.findByText('Coffee')).toBeOnTheScreen();
    expect(screen.queryByText('Rolled oats')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('0 calories, 0 grams of protein today')).toBeOnTheScreen();
  });

  it('moves on at midnight and not later, whatever second Today was opened at', async () => {
    // Given Today open at 23:59:30 on an entry
    const clock = new ScriptedClock();
    clock.advance(Date.UTC(2026, 10, 24, 23, 59, 30));
    const entries = await withLunches('lunch');
    await openToday(entries, clock);
    expect(await screen.findByText('Lunch')).toBeOnTheScreen();

    // When midnight comes, half a minute on
    await act(async () => clock.advance(30_000));

    // Then the new day is there, and it is empty
    expect(await screen.findByText('Nothing logged yet')).toBeOnTheScreen();
    expect(screen.queryByText('Lunch')).not.toBeOnTheScreen();
  });

  it('shows the last three of a new day, though all of yesterday was asked for', async () => {
    // Given all of a day of four asked for, at 23:59, and a longer day after it
    const clock = new ScriptedClock();
    clock.advance(Date.UTC(2026, 10, 24, 23, 59));
    const entries = await withLunches('first', 'second', 'third', 'fourth');
    for (const label of ['fifth', 'sixth', 'seventh', 'eighth', 'ninth']) {
      await entries.add(estimatedEntry({ label, calories: 100 }, '2026-11-25'));
    }
    await openToday(entries, clock);
    await userEvent.press(await screen.findByRole('button', { name: 'Show all 4' }));
    expect(screen.getByText('First')).toBeOnTheScreen();

    // When midnight comes
    await act(async () => clock.advance(60_000));

    // Then the new day's last three are there, and the rest can be asked for
    expect(await screen.findByRole('button', { name: 'Show all 5' })).toBeOnTheScreen();
    expect(screen.queryByText('Fifth')).not.toBeOnTheScreen();
    expect(screen.getByText('Ninth')).toBeOnTheScreen();
  });

  it('claims nothing of the new day until it is read', async () => {
    // Given Today open at 23:59 on an entry, over a store that takes a while to read the next day
    const clock = new ScriptedClock();
    clock.advance(Date.UTC(2026, 10, 24, 23, 59));
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    await openToday(entries, clock);
    expect(await screen.findByText('Rolled oats')).toBeOnTheScreen();
    const read = entries.holdNextRead();

    // When midnight comes
    await act(async () => clock.advance(60_000));

    // Then yesterday's entry and figures are gone at once, and the empty day said when it is read
    expect(screen.queryByText('Rolled oats')).not.toBeOnTheScreen();
    expect(screen.queryByText(/kcal/)).not.toBeOnTheScreen();
    expect(screen.queryByText('Nothing logged yet')).not.toBeOnTheScreen();
    await act(async () => read());
    expect(screen.getByText('Nothing logged yet')).toBeOnTheScreen();
  });

  it('deletes yesterday’s entry when answered after midnight, and stays on the new day', async () => {
    // Given an entry asked about at 23:59, and midnight gone by with the question up
    const clock = new ScriptedClock();
    clock.advance(Date.UTC(2026, 10, 24, 23, 59));
    const entries = new InMemoryEntryStore([OATS, COFFEE]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    await entries.add(weighedEntry(OATS, 20, '2026-11-24'));
    await entries.add(weighedEntry(COFFEE, 250, '2026-11-25'));
    const ask = new ScriptedAsk();
    await openToday(entries, clock, ask);
    await deleteFrom('Rolled oats, 80 grams, 235 calories, 10 grams of protein');
    await act(async () => clock.advance(60_000));
    expect(await screen.findByText('Coffee')).toBeOnTheScreen();

    // When the user says to delete it
    await act(async () => ask.answer(true));

    // Then it is gone from its own day, and what is shown is the new one's
    expect(await entries.listOn('2026-11-24')).toHaveLength(1);
    expect(screen.getByText('Coffee')).toBeOnTheScreen();
    expect(screen.queryByText('Rolled oats')).not.toBeOnTheScreen();
  });

  it('is the new day where midnight went by with the app behind another, and no timer ran', async () => {
    // Given Today open on an entry of the 24th
    const clock = atNoon();
    const entries = new InMemoryEntryStore([OATS, COFFEE]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    await entries.add(weighedEntry(COFFEE, 250, '2026-11-25'));
    await openToday(entries, clock);
    expect(await screen.findByText('Rolled oats')).toBeOnTheScreen();

    // When the app is come back to the next noon, and two seconds have gone by
    clock.sleep(24 * 60 * 60_000);
    await act(async () => clock.advance(2_000));

    // Then it is the 25th, with what was eaten then alone
    expect(await screen.findByText('Coffee')).toBeOnTheScreen();
    expect(screen.queryByText('Rolled oats')).not.toBeOnTheScreen();
  });

  it('is the new day two seconds after the phone is moved to another zone', async () => {
    // Given Today open on the evening of the 24th in Auckland, and an entry of that day
    const clock = new ScriptedClock();
    clock.setUtcOffset(780);
    clock.advance(Date.UTC(2026, 10, 24, 7));
    const entries = new InMemoryEntryStore([OATS, COFFEE]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    await entries.add(weighedEntry(COFFEE, 250, '2026-11-23'));
    await openToday(entries, clock);
    expect(await screen.findByText('Rolled oats')).toBeOnTheScreen();

    clock.setUtcOffset(-480);
    await act(async () => clock.advance(1_999));
    expect(screen.getByText('Rolled oats')).toBeOnTheScreen();

    // When it has been in Los Angeles, where it is still the 23rd, for two seconds and not less
    await act(async () => clock.advance(1));

    // Then it is that day, and the entry has kept its own
    expect(await screen.findByText('Coffee')).toBeOnTheScreen();
    expect(screen.queryByText('Rolled oats')).not.toBeOnTheScreen();
    expect(await entries.listOn('2026-11-24')).toHaveLength(1);
  });

  it.each([
    [1, '1 entry · 500 kcal', '1 entry, 500 calories'],
    [3, '3 entries · 1,500 kcal', '3 entries, 1500 calories'],
  ])('heads the day’s entries with its date and tallies %d', async (count, tally, spoken) => {
    // Given a day's weighed entries of 500 kcal each
    const entries = new InMemoryEntryStore([OATS]);
    const eaten = { ...weighedEntry(OATS, 80, '2026-11-24'), calories: 500 };
    for (let logged = 0; logged < count; logged++) await entries.add(eaten);

    // When the user opens Today
    await openToday(entries);

    // Then they are under the day, and how many there are, to the eye and the ear
    expect(await screen.findByRole('header', { name: 'Today · Tue 24 Nov' })).toBeOnTheScreen();
    expect(screen.getByText(tally)).toBeOnTheScreen();
    expect(screen.getByLabelText(spoken)).toBeOnTheScreen();
  });

  it('shows the last three of a longer day, the one just logged among them, and tallies every one', async () => {
    // Given a day of four entries
    const entries = await withLunches('first', 'second', 'third', 'fourth');

    // When the user opens Today
    await openToday(entries);

    // Then the last three are there, oldest first, and the rest can be asked for
    const met = await screen.findAllByText(/^(First|Second|Third|Fourth)$/);
    expect(met.map((text) => text.children[0])).toEqual(['Second', 'Third', 'Fourth']);
    expect(screen.getByRole('button', { name: 'Show all 4' })).toBeOnTheScreen();
    expect(screen.getByText('4 entries · about 400 kcal')).toBeOnTheScreen();
  });

  it('shows all of a longer day when asked, and the last three again', async () => {
    // Given a day of four entries, all of them asked for and seen
    await openToday(await withLunches('first', 'second', 'third', 'fourth'));
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Show all 4' }));
    expect(screen.getByText('First')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Show all 4' })).not.toBeOnTheScreen();

    // When the user asks for less
    await user.press(screen.getByRole('button', { name: 'Show less' }));

    // Then the first is off it, and can be asked for
    expect(screen.queryByText('First')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Show all 4' })).toBeOnTheScreen();
  });

  it('shows a day of three whole, with nothing to ask for', async () => {
    // Given a day of three entries
    const entries = await withLunches('first', 'second', 'third');

    // When the user opens Today
    await openToday(entries);

    // Then they are all there, oldest first, with no control
    const met = await screen.findAllByText(/^(First|Second|Third)$/);
    expect(met.map((text) => text.children[0])).toEqual(['First', 'Second', 'Third']);
    expect(screen.queryByRole('button', { name: /^Show/ })).not.toBeOnTheScreen();
  });

  it('says an empty day is known zeros, and offers Log', async () => {
    // Given nothing logged today
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 500, '2026-11-23'));

    // When the user opens Today
    await openToday(entries);

    // Then it says 0 of each, that nothing is logged, and the way to log
    expect(await screen.findByText('Nothing logged yet')).toBeOnTheScreen();
    expect(screen.getByText('0 kcal')).toBeOnTheScreen();
    expect(screen.getByText('0 g protein')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Log' })).toBeOnTheScreen();
    expect(screen.queryByText('Couldn’t load today’s summary')).not.toBeOnTheScreen();
  });

  it('gives an empty day’s list one line, with the way on and without saying again that it is empty', async () => {
    // Given nothing logged today
    const entries = new InMemoryEntryStore([OATS]);

    // When the user opens Today
    await openToday(entries);

    // Then the list is one line, and the summary alone says nothing is logged
    expect(await screen.findByText('Log a weighed food, or an estimate.')).toBeOnTheScreen();
    expect(screen.getAllByText('Nothing logged yet')).toHaveLength(1);
  });

  it('tells a screen reader that nothing is logged, with the day’s zeros', async () => {
    // Given nothing logged today
    const entries = new InMemoryEntryStore([OATS]);

    // When the user opens Today
    await openToday(entries);

    // Then the summary is heard as known zeros and an empty day
    expect(
      await screen.findByLabelText('0 calories, 0 grams of protein today, nothing logged yet'),
    ).toBeOnTheScreen();
  });

  it('goes to Log from an empty day', async () => {
    // Given Today open with nothing logged
    await openToday(new InMemoryEntryStore([OATS]));
    const log = await screen.findByRole('button', { name: 'Log' });

    // When the user takes the way on
    await userEvent.press(log);

    // Then Log is open
    expect(screen).toHavePathname('/log');
  });

  it('announces that it could not read the day', async () => {
    // Given a day that cannot be read
    const entries = new InMemoryEntryStore([OATS]);
    entries.unreadable = true;

    // When the user opens Today
    await openToday(entries);

    // Then a screen reader is told at once
    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load today’s summary');
  });

  it('says it could not read the day, rather than that it is empty, and reads it when asked', async () => {
    // Given Today open on a day that could not be read, and now can be
    const entries = new InMemoryEntryStore([OATS]);
    await entries.add(weighedEntry(OATS, 80, '2026-11-24'));
    entries.unreadable = true;
    await openToday(entries);
    const tryAgain = await screen.findByRole('button', { name: 'Retry' });
    expect(screen.getByText('Couldn’t load today’s summary')).toBeOnTheScreen();
    expect(screen.queryByText('Nothing logged yet')).not.toBeOnTheScreen();
    expect(screen.queryByText(/kcal/)).not.toBeOnTheScreen();
    entries.unreadable = false;

    // When the user tries again
    await userEvent.press(tryAgain);

    // Then the day is there, and nothing says it could not be read
    expect(await screen.findByText('Rolled oats')).toBeOnTheScreen();
    expect(screen.queryByText('Couldn’t load today’s summary')).not.toBeOnTheScreen();
  });
});
