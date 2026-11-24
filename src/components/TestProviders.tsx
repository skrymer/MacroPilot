import { useState, type ReactNode } from 'react';

import { ClockProvider } from '@/lifecycle/ClockContext';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { FoodStoreProvider } from '@/storage/FoodStoreContext';
import { InMemoryFoodStore } from '@/storage/InMemoryFoodStore';

/**
 * For screen tests: the providers the root layout gives every screen, over the fakes. Each has a
 * quiet default (a clock nobody moves, a store with nothing in it), so a test names only what it is
 * about.
 */
export function TestProviders({
  clock,
  foods,
  children,
}: {
  clock?: ScriptedClock;
  foods?: InMemoryFoodStore;
  children: ReactNode;
}) {
  const [quietClock] = useState(() => new ScriptedClock());
  const [noFoods] = useState(() => new InMemoryFoodStore());
  return (
    <ClockProvider clock={clock ?? quietClock}>
      <FoodStoreProvider store={foods ?? noFoods}>{children}</FoodStoreProvider>
    </ClockProvider>
  );
}
