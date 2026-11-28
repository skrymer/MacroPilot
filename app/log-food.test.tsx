import { act, screen, userEvent, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { TestProviders } from '@/components/TestProviders';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { InMemoryEntryStore } from '@/storage/InMemoryEntryStore';
import { InMemoryFoodStore } from '@/storage/InMemoryFoodStore';
import { InMemoryReviewStore } from '@/storage/InMemoryReviewStore';

import LogFood from './log-food';

/** 294 kcal in 100 g: 13 g of protein and 20 of carbohydrate at 4 kcal a gram, 18 of fat at 9. */
const OATS = { name: 'rolled oats', macros: { protein: 13, carbohydrate: 20, fat: 18 } };

/** A clock on 28 November 2026, at noon in UTC. */
const onTheDay = () => {
  const clock = new ScriptedClock();
  clock.advance(Date.UTC(2026, 10, 28, 12));
  return clock;
};

/** Oats kept, 1520 kcal logged today, and today's review of a budget of 1840 kcal. */
const aDay = async () => {
  const foods = new InMemoryFoodStore();
  await foods.add(OATS);
  const entries = new InMemoryEntryStore(await foods.list());
  await entries.add({ day: '2026-11-28', label: 'Lunch', calories: 1520, protein: 40 });
  const reviews = new InMemoryReviewStore();
  await reviews.save({
    day: '2026-11-28',
    trendKg: 82,
    maintenanceKcal: 2390,
    budgetKcal: 1840,
    proteinFloorG: 164,
  });
  return { foods, entries, reviews };
};

/** Opens the oats' grams form over the stores given. */
const openOats = async (stores: Awaited<ReturnType<typeof aDay>>) => {
  const [oats] = await stores.foods.list();
  return renderRouter(
    { _layout: () => <Stack />, 'log-food': LogFood },
    {
      initialUrl: `/log-food?id=${oats?.id}`,
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders {...stores} clock={onTheDay()}>
          {children}
        </TestProviders>
      ),
    },
  );
};

describe('The grams form’s over line', () => {
  it('says how far past the budget the entry would put the day', async () => {
    // Given 1520 kcal logged against a budget of 1840, and the oats' form open
    await openOats(await aDay());
    const user = userEvent.setup();

    // When 120 g is typed: 352.8 kcal, the day at 1872.8
    await user.type(await screen.findByLabelText('Weight (g)'), '120');

    // Then the line says the day would be about 33 kcal over its 1840 kcal budget
    await waitFor(() =>
      expect(
        screen.queryByText(/^This puts you about 33\skcal over your 1840\skcal budget\.$/),
      ).toBeOnTheScreen(),
    );
  });

  it('judges against the new day once midnight passes with the form open', async () => {
    // Given 1520 kcal logged on the 28th against 1840, the form open at 23:59:50 with 120 g typed
    const stores = await aDay();
    const clock = new ScriptedClock();
    clock.advance(Date.UTC(2026, 10, 28, 23, 59, 50));
    const [oats] = await stores.foods.list();
    await renderRouter(
      { _layout: () => <Stack />, 'log-food': LogFood },
      {
        initialUrl: `/log-food?id=${oats?.id}`,
        wrapper: ({ children }: { children: ReactNode }) => (
          <TestProviders {...stores} clock={clock}>
            {children}
          </TestProviders>
        ),
      },
    );
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Weight (g)'), '120');
    await screen.findByText(/^This puts you about 33\skcal over/);

    // When midnight passes, and the screen looks at the clock again
    await act(() => clock.advance(20_000));

    // Then the 29th has nothing logged, and 352.8 kcal is under its budget: no line
    await waitFor(() => expect(screen.queryByText(/^This puts you about/)).not.toBeOnTheScreen());
  });
});
