import type { AgainstFloor } from '@/domain/verdict';

import { grams, spokenGrams } from './figures';

/** A day's protein against its floor, as the ring card shows it and as a screen reader says it. */
export function proteinWords(against: AgainstFloor, floorG: number) {
  switch (against.standing) {
    case 'not stated':
      return { shown: 'protein not stated', spoken: 'protein not stated' };
    case 'met':
      return { shown: 'protein floor met', spoken: 'protein floor met' };
    case 'at least':
      return {
        shown: `at least ${grams(against.grams)}, floor ${grams(floorG)}`,
        spoken: `at least ${spokenGrams(against.grams)} of protein, floor ${spokenGrams(floorG)}`,
      };
    case 'to go':
      return {
        shown: `${grams(against.grams)} protein to go`,
        spoken: `${spokenGrams(against.grams)} of protein to go`,
      };
  }
}
