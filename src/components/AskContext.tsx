import { createContext, useContext, type ReactNode } from 'react';

import type { Ask } from './Ask';

const AskContext = createContext<Ask | null>(null);

/** Hands screens their `Ask`, so a test can answer for the user. */
export function AskProvider({ ask, children }: { ask: Ask; children: ReactNode }) {
  return <AskContext.Provider value={ask}>{children}</AskContext.Provider>;
}

export function useAsk(): Ask {
  const ask = useContext(AskContext);
  if (ask === null) throw new Error('useAsk needs an AskProvider');
  return ask;
}
