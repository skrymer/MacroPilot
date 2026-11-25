import type { FieldErrors } from 'react-hook-form';

/** Why a form of several fields was not kept, said by its button: the field at fault can be out of view. */
export function formFault(errors: FieldErrors): string | undefined {
  const refused = Object.keys(errors).some((name) => name !== 'root');
  return refused ? 'Not saved. A field above needs changing.' : errors.root?.message;
}
