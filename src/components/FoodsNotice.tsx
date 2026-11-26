import { useRouter } from 'expo-router';

import type { Food } from '@/domain/food';
import type { Reading } from '@/storage/useReading';

import { Notice } from './Notice';
import { Unreadable } from './Unreadable';

/** What a list of the user's foods says in place of them. */
export function FoodsNotice({ foods, readAgain }: { foods: Reading<Food>; readAgain: () => void }) {
  const router = useRouter();
  if (foods === 'unread') return null;
  if (foods === 'unreadable') {
    return <Unreadable words="Couldn’t load your foods" onRetry={readAgain} />;
  }
  return (
    <Notice
      title="Build your food catalog"
      detail="Add the foods you eat regularly so logging takes a tap."
      action="Add your first food"
      // Not `push`, which opens a second form over the first when it is pressed twice.
      onAction={() => router.navigate('/add-food')}
    />
  );
}
