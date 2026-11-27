import type { WeighIn } from '@/domain/weighIn';

/** The user's weigh-ins. A call that fails rejects, and has changed nothing. */
export interface WeighInStore {
  /** Replaces the one saved for its day before. */
  save(weighIn: WeighIn): Promise<void>;
  /** Oldest first. */
  list(): Promise<WeighIn[]>;
}
