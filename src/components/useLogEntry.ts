import { useRouter } from 'expo-router';
import type { FieldErrors, FieldValues, UseFormReturn } from 'react-hook-form';

import { useClock } from '@/lifecycle/ClockContext';
import { dayAt } from '@/lifecycle/dayAt';
import { useEntryStore } from '@/storage/EntryStoreContext';

import { useLogged, type Logged } from './LoggedContext';
import { useSave } from './useSave';

/** Logs the entry a form says, on the phone's day when it is saved and not when the form was opened. */
export function useLogEntry<Typed extends FieldValues, Said>({
  form,
  entryOn,
  onRefused,
}: {
  form: Pick<UseFormReturn<Typed, unknown, Said>, 'handleSubmit' | 'setError'>;
  entryOn: (said: Said, day: string) => Logged;
  onRefused?: (faults: FieldErrors<Typed>) => void;
}) {
  const router = useRouter();
  const clock = useClock();
  const store = useEntryStore();
  const [, setLogged] = useLogged();
  const leave = () => router.dismissTo('/log');
  const log = useSave({
    form,
    write: async (said) => {
      const logged = entryOn(said, dayAt(clock, clock.now()));
      await store.add(logged.entry);
      setLogged(logged);
    },
    failed: 'Could not save entry. What you typed is still here.',
    leave,
    onRefused,
  });
  return { log, leave };
}
