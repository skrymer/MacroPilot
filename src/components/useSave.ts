import { useNavigation } from 'expo-router';
import { useRef } from 'react';
import type { FieldErrors, FieldValues, UseFormReturn } from 'react-hook-form';

/**
 * Saves a form, one save at a time. A write that fails says `failed` and leaves the form as it was. One
 * that works is the last, since the page can still be pressed while it goes.
 */
export function useSave<Typed extends FieldValues, Said>({
  form: { handleSubmit, setError },
  write,
  failed,
  leave,
  onRefused,
}: {
  form: Pick<UseFormReturn<Typed, unknown, Said>, 'handleSubmit' | 'setError'>;
  write: (said: Said) => Promise<void>;
  failed: string;
  leave: () => void;
  onRefused?: (faults: FieldErrors<Typed>) => void;
}): () => void {
  const navigation = useNavigation();
  const saving = useRef(false);
  const submit = async (said: Said) => {
    try {
      await write(said);
    } catch {
      setError('root', { message: failed });
      saving.current = false;
      return;
    }
    // The user may have left while it was written, and is not taken from where they went.
    if (navigation.isFocused()) leave();
  };
  const refuse = (faults: FieldErrors<Typed>) => {
    saving.current = false;
    onRefused?.(faults);
  };
  return () => {
    if (saving.current) return;
    saving.current = true;
    void handleSubmit(submit, refuse)();
  };
}
