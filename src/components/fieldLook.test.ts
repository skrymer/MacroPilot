import { fieldLook } from './fieldLook';

describe('fieldLook', () => {
  it('marks a field left with something right in it as valid', () => {
    // Given a field typed in, left, and judged right
    const state = { invalid: false, isTouched: true, isDirty: true };

    // When its look is chosen
    const look = fieldLook(state);

    // Then it is valid
    expect(look).toBe('valid');
  });

  it('marks a field judged wrong as at fault', () => {
    // Given a field typed in, left, and judged wrong
    const state = { invalid: true, isTouched: true, isDirty: true };

    // When its look is chosen
    const look = fieldLook(state);

    // Then it is at fault
    expect(look).toBe('fault');
  });

  it('leaves a field still being typed in, never left, as it stands', () => {
    // Given a field typed in and not yet left
    const state = { invalid: false, isTouched: false, isDirty: true };

    // When its look is chosen
    const look = fieldLook(state);

    // Then it is at rest
    expect(look).toBe('rest');
  });

  it('leaves a field left blank as it stands, since nothing in it was judged right', () => {
    // Given an optional field passed through with nothing typed
    const state = { invalid: false, isTouched: true, isDirty: false };

    // When its look is chosen
    const look = fieldLook(state);

    // Then it is at rest, not ticked
    expect(look).toBe('rest');
  });
});
