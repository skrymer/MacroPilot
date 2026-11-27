import type { Review } from '@/domain/review';

/** The Weekly Reviews. A call that fails rejects, and has changed nothing. */
export interface ReviewStore {
  /** Replaces every review dated on or after its day. */
  save(review: Review): Promise<void>;
  /** Oldest first. */
  list(): Promise<Review[]>;
}
