import { useRef } from 'react';

/**
 * One save at a time. `save` says whether it worked, and one that did is the last: the page can still
 * be pressed while it goes.
 */
export function useSave(save: () => Promise<boolean>): () => Promise<void> {
  const saving = useRef(false);
  return async () => {
    if (saving.current) return;
    saving.current = true;
    saving.current = await save();
  };
}
