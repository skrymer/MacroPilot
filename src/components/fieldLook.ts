import type { ControllerFieldState } from 'react-hook-form';

/** How a field is drawn: at fault, right, or as it stands (DESIGN.md, *Forms*). */
export type FieldLook = 'fault' | 'valid' | 'rest';

/**
 * A field is right once it is left with something in it that was judged so; a blank one left behind,
 * optional or not yet judged, is not marked.
 */
export function fieldLook({
  invalid,
  isTouched,
  isDirty,
}: Pick<ControllerFieldState, 'invalid' | 'isTouched' | 'isDirty'>): FieldLook {
  if (invalid) return 'fault';
  return isTouched && isDirty ? 'valid' : 'rest';
}
