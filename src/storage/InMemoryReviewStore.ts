import type { Review } from '@/domain/review';

import type { ReviewStore } from './ReviewStore';

/** For tests: a `ReviewStore` that forgets, and can be made to fail as a phone's storage would. */
export class InMemoryReviewStore implements ReviewStore {
  unreadable = false;
  unwritable = false;
  private reviews: Review[] = [];

  async save(review: Review): Promise<void> {
    if (this.unwritable) throw new Error('The reviews cannot be written');
    this.reviews = [...this.reviews.filter(({ day }) => day < review.day), review];
  }

  async list(): Promise<Review[]> {
    if (this.unreadable) throw new Error('The reviews cannot be read');
    return [...this.reviews];
  }
}
