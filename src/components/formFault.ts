import type { FieldErrors } from 'react-hook-form';

/**
 * Why a form of several fields was not kept, said by its button once a save was refused: the field at
 * fault can be out of view. A field judged as it is left says so beside itself, and nothing was saved
 * or refused yet.
 */
export function formFault({
  errors,
  isSubmitted,
}: {
  errors: FieldErrors;
  isSubmitted: boolean;
}): string | undefined {
  const refused = isSubmitted && Object.keys(errors).some((name) => name !== 'root');
  return refused ? 'Not saved. A field above needs changing.' : errors.root?.message;
}
