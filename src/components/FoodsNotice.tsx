import { useRouter } from 'expo-router';

import type { Food } from '@/domain/food';
import type { Reading } from '@/storage/useReading';

import { Notice } from './Notice';

/** What a list of the user's foods says in place of them. */
export function FoodsNotice({ foods, readAgain }: { foods: Reading<Food>; readAgain: () => void }) {
  const router = useRouter();
  if (foods === 'unread') return null;
  if (foods === 'unreadable') {
    return <Notice title="Your foods could not be read" action="Try again" onAction={readAgain} />;
  }
  return (
    <Notice
      title="No foods yet"
      detail="Add the foods you eat regularly, so logging takes a press and a figure."
      action="Add food"
      // Not `push`, which opens a second form over the first when it is pressed twice.
      onAction={() => router.navigate('/add-food')}
    />
  );
}
