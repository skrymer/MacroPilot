import type { againstFloor } from '@/domain/verdict';

import { grams, spokenGrams } from './figures';

/** A day's protein against its floor, as the ring card shows it and as a screen reader says it. */
export function proteinWords(against: ReturnType<typeof againstFloor>, floorG: number) {
  if (against.standing === 'at least') {
    const known = against.grams ?? 0;
    return {
      shown: `at least ${grams(known)}, floor ${grams(floorG)}`,
      spoken: `at least ${spokenGrams(known)} of protein, floor ${spokenGrams(floorG)}`,
    };
  }
  if (against.standing === 'not stated') {
    return { shown: 'protein not stated', spoken: 'protein not stated' };
  }
  if (against.standing === 'met') {
    return { shown: 'protein floor met', spoken: 'protein floor met' };
  }
  const left = against.grams ?? 0;
  return { shown: `${grams(left)} protein to go`, spoken: `${spokenGrams(left)} of protein to go` };
}
