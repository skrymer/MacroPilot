import type { Review } from '@/domain/review';

import { held } from './held';
import type { ReviewStore } from './ReviewStore';

/** For tests: a `ReviewStore` that forgets, and can be made to fail as a phone's storage would. */
export class InMemoryReviewStore implements ReviewStore {
  unreadable = false;
  unwritable = false;
  private writable: Promise<void> = Promise.resolve();
  private reviews: Review[] = [];

  /** Every write waits from here until what this gives back is called. */
  holdWrites(): () => void {
    const { until, release } = held();
    this.writable = until;
    return release;
  }

  async save(review: Review): Promise<void> {
    await this.writable;
    if (this.unwritable) throw new Error('The reviews cannot be written');
    this.reviews = [...this.reviews.filter(({ day }) => day < review.day), review];
  }

  async list(): Promise<Review[]> {
    if (this.unreadable) throw new Error('The reviews cannot be read');
    return [...this.reviews];
  }
}
