import { useState, type ReactNode } from 'react';

import { ClockProvider } from '@/lifecycle/ClockContext';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { EntryStoreProvider } from '@/storage/EntryStoreContext';
import { FoodStoreProvider } from '@/storage/FoodStoreContext';
import { InMemoryEntryStore } from '@/storage/InMemoryEntryStore';
import { InMemoryFoodStore } from '@/storage/InMemoryFoodStore';

import { AskProvider } from './AskContext';
import { LoggedProvider } from './LoggedContext';
import { ScriptedAsk } from './ScriptedAsk';

/**
 * For screen tests: the providers the root layout gives every screen, over the fakes. Each has a
 * quiet default (a clock nobody moves, a store with nothing in it), so a test names only what it is
 * about.
 */
export function TestProviders({
  clock,
  foods,
  entries,
  ask,
  children,
}: {
  clock?: ScriptedClock;
  foods?: InMemoryFoodStore;
  entries?: InMemoryEntryStore;
  ask?: ScriptedAsk;
  children: ReactNode;
}) {
  const [quietClock] = useState(() => new ScriptedClock());
  const [noFoods] = useState(() => new InMemoryFoodStore());
  const [noEntries] = useState(() => new InMemoryEntryStore());
  const [unanswered] = useState(() => new ScriptedAsk());
  return (
    <ClockProvider clock={clock ?? quietClock}>
      <FoodStoreProvider store={foods ?? noFoods}>
        <EntryStoreProvider store={entries ?? noEntries}>
          <AskProvider ask={ask ?? unanswered}>
            <LoggedProvider>{children}</LoggedProvider>
          </AskProvider>
        </EntryStoreProvider>
      </FoodStoreProvider>
    </ClockProvider>
  );
}
