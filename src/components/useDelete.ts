import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useAsk } from './AskContext';

/**
 * Deletes one thing at a time, asked about first, until `onDeleted` has shown it gone. One that is still
 * there says why until the next is asked about or the page is left: what `remove` gives back, or `failed` where it rejects.
 */
export function useDelete<Item extends { id: number }>({
  title,
  message,
  remove,
  failed,
  onDeleted,
}: {
  title: string;
  message: (item: Item) => string;
  remove: (item: Item) => Promise<string | void>;
  failed: string;
  onDeleted: () => Promise<void>;
}) {
  const ask = useAsk();
  const busy = useRef(false);
  const [fault, setFault] = useState<{ id: number; why: string }>();
  // What stopped it may be gone by the time the page is come back to.
  useFocusEffect(useCallback(() => () => setFault(undefined), []));
  const begin = async (item: Item) => {
    if (busy.current) return;
    busy.current = true;
    setFault(undefined);
    try {
      if (await ask.ask({ title, message: message(item), loses: 'Delete' })) {
        const refused = await remove(item);
        if (refused) setFault({ id: item.id, why: refused });
        else await onDeleted();
      }
    } catch {
      setFault({ id: item.id, why: failed });
    }
    busy.current = false;
  };
  return { begin, fault };
}
