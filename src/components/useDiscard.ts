import { usePreventRemove } from 'expo-router';
import { useRef, useState } from 'react';

import { useAsk } from './AskContext';

/**
 * Asks before a page with something typed in it is left, on every way out. What it gives back lets the
 * page go without asking, for one whose save worked.
 */
export function useDiscard(typed: boolean, title: string): () => void {
  const ask = useAsk();
  const asking = useRef(false);
  const gone = useRef(false);
  const [letGo, setLetGo] = useState(false);
  const askToLeave = async (leave: () => void) => {
    if (asking.current) return;
    asking.current = true;
    const goesOn = await ask.ask({ title, loses: 'Discard' });
    asking.current = false;
    // The page may have gone under the question, and its way out leads nowhere now.
    if (!goesOn || gone.current) return;
    setLetGo(true);
    leave();
  };
  const stopHolding = usePreventRemove(typed && !letGo, ({ repeat }) => void askToLeave(repeat));
  return () => {
    gone.current = true;
    setLetGo(true);
    stopHolding();
  };
}
