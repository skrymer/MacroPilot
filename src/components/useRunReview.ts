import { reviewDue } from '@/domain/review';
import { useGoalStore } from '@/storage/GoalStoreContext';
import { useProfileStore } from '@/storage/ProfileStoreContext';
import { useReviewStore } from '@/storage/ReviewStoreContext';
import { useWeighInStore } from '@/storage/WeighInStoreContext';

/**
 * Runs the review the domain says is due after a save (`reviewDue`), on `today`, as `2026-11-24`, and
 * keeps it. What was saved is read back, the Goal in force with it, so the review is set from what is
 * kept.
 */
export function useRunReview() {
  const profiles = useProfileStore();
  const weighIns = useWeighInStore();
  const reviews = useReviewStore();
  const goals = useGoalStore();
  return async (today: string, replacedToday = false, goalSet = false) => {
    const [profile, weighed, held, goal] = await Promise.all([
      profiles.read(),
      weighIns.list(),
      reviews.list(),
      goals.read(),
    ]);
    const due = reviewDue({
      profile,
      weighIns: weighed,
      reviews: held,
      today,
      replacedToday,
      goal,
      goalSet,
    });
    if (due) await reviews.save(due);
  };
}
