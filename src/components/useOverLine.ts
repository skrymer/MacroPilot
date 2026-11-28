import { useCallback } from 'react';

import { totalsOf } from '@/domain/dailyLog';
import { reviewFor } from '@/domain/review';
import { overLine } from '@/domain/verdict';
import { useToday } from '@/lifecycle/useToday';
import { useEntryStore } from '@/storage/EntryStoreContext';
import { useReading } from '@/storage/useReading';
import { useReviews } from '@/storage/useReviews';

/**
 * Where today would stand with an entry of `entryKcal` being typed, against the budget today is held
 * to, once past it; nothing before Setup, under the budget, or with no figure typed.
 */
export function useOverLine(entryKcal: (day: string) => number | undefined) {
  const today = useToday();
  const entries = useEntryStore();
  const list = useCallback(() => entries.listOn(today), [entries, today]);
  const { found } = useReading(list);
  const { reviews } = useReviews();
  const heldTo = Array.isArray(reviews) ? reviewFor(reviews, today) : undefined;
  if (!Array.isArray(found) || heldTo === undefined) return undefined;
  const line = overLine(totalsOf(found).calories, entryKcal(today), heldTo.budgetKcal);
  return line && { ...line, budgetKcal: heldTo.budgetKcal };
}
