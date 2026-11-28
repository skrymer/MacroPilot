import type { AgainstFloor } from '@/domain/verdict';

import { grams, spokenGrams } from './figures';

/** A day's protein against its floor, as the ring card shows it and as a screen reader says it. */
export function proteinWords(against: AgainstFloor, floorG: number) {
  switch (against.standing) {
    case 'not stated':
      return { shown: 'protein not stated', spoken: 'protein not stated' };
    case 'met':
      return { shown: 'protein floor met', spoken: 'protein floor met' };
    case 'at least': {
      // What is known down and the floor up: a floor not yet met never reads as reached.
      const known = Math.floor(against.grams);
      const floor = Math.ceil(floorG);
      return {
        shown: `at least ${grams(known)}, floor ${grams(floor)}`,
        spoken: `at least ${spokenGrams(known)} of protein, floor ${spokenGrams(floor)}`,
      };
    }
    case 'to go': {
      // Up: a floor not yet met never has 0 g to go.
      const left = Math.ceil(against.grams);
      return {
        shown: `${grams(left)} protein to go`,
        spoken: `${spokenGrams(left)} of protein to go`,
      };
    }
  }
}
