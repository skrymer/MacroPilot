import { reviewDue } from '@/domain/review';
import { useProfileStore } from '@/storage/ProfileStoreContext';
import { useReviewStore } from '@/storage/ReviewStoreContext';
import { useWeighInStore } from '@/storage/WeighInStoreContext';

/**
 * Runs the review the domain says is due after a save (`reviewDue`), on `today`, as `2026-11-24`, and
 * keeps it. What was saved is read back, so the review is set from what is kept.
 */
export function useRunReview() {
  const profiles = useProfileStore();
  const weighIns = useWeighInStore();
  const reviews = useReviewStore();
  return async (today: string, replacedToday = false) => {
    const due = reviewDue({
      profile: await profiles.read(),
      weighIns: await weighIns.list(),
      reviews: await reviews.list(),
      today,
      replacedToday,
    });
    if (due) await reviews.save(due);
  };
}
