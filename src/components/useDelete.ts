import { useRef, useState } from 'react';

import { useAsk } from './AskContext';

/**
 * Deletes one thing at a time, asked about first, until `onDeleted` has shown it gone. `failed` is the
 * id of the one whose delete did not work, until the next is asked about.
 */
export function useDelete({
  title,
  remove,
  onDeleted,
}: {
  title: string;
  remove: (id: number) => Promise<void>;
  onDeleted: () => Promise<void>;
}) {
  const ask = useAsk();
  const busy = useRef(false);
  const [failed, setFailed] = useState<number>();
  const begin = async (id: number, message: string) => {
    if (busy.current) return;
    busy.current = true;
    setFailed(undefined);
    try {
      if (await ask.ask({ title, message, loses: 'Delete' })) {
        await remove(id);
        await onDeleted();
      }
    } catch {
      setFailed(id);
    }
    busy.current = false;
  };
  return { begin, failed };
}
