import { createContext, useContext, useState, type ReactNode } from 'react';

import type { WeighedEntry } from '@/domain/entry';

/** What was logged last, under the name it was logged by: the sheet says it and Log shows it. */
export type Logged = { name: string; entry: WeighedEntry };

type LoggedState = [Logged | undefined, (logged: Logged | undefined) => void];

const LoggedContext = createContext<LoggedState | null>(null);

export function LoggedProvider({ children }: { children: ReactNode }) {
  const [logged, setLogged] = useState<Logged>();
  return <LoggedContext.Provider value={[logged, setLogged]}>{children}</LoggedContext.Provider>;
}

export function useLogged(): LoggedState {
  const state = useContext(LoggedContext);
  if (state === null) throw new Error('useLogged needs a LoggedProvider');
  return state;
}
