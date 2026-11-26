import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen, userEvent } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormField } from './FormField';
import { Text } from './Text';

/** A form of one field, which says what it was given when it is submitted. */
function OneField({ onSubmit }: { onSubmit: (name: string) => void }) {
  const { control, handleSubmit } = useForm({
    mode: 'onTouched',
    defaultValues: { name: '' },
    resolver: zodResolver(z.object({ name: z.string().min(1, 'Enter a name') })),
  });
  return (
    <>
      <FormField control={control} name="name" label="Name" />
      <Text onPress={() => void handleSubmit(({ name }) => onSubmit(name))()}>Save</Text>
    </>
  );
}

describe('FormField', () => {
  it('gives its form what was typed in the field it labels', async () => {
    // Given a form with a name typed in it
    const given: string[] = [];
    await render(<OneField onSubmit={(name) => given.push(name)} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Name'), 'Rolled oats');

    // When it is submitted
    await user.press(screen.getByText('Save'));

    // Then it has the name
    expect(given).toEqual(['Rolled oats']);
  });

  it('is named once to a screen reader, by the field and not its label as well', async () => {
    // Given a form with a field in it
    const form = <OneField onSubmit={() => {}} />;

    // When it is shown
    await render(form);

    // Then the label is there to be seen and only the field is heard
    expect(screen.getByText('Name', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.queryByText('Name')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Name')).toBeOnTheScreen();
  });

  it('says its fault beside it, and to a screen reader on the field', async () => {
    // Given a form that asks for a name, left blank
    await render(<OneField onSubmit={() => {}} />);

    // When it is submitted
    await userEvent.press(screen.getByText('Save'));

    // Then the fault is shown, and heard with the field
    expect(await screen.findByText('Enter a name')).toBeOnTheScreen();
    expect(screen.getByLabelText('Name')).toHaveProp('accessibilityHint', 'Enter a name');
  });

  it('has its fault between its label and the field, which the keyboard keeps in view', async () => {
    // Given a form that asks for a name, left blank
    await render(<OneField onSubmit={() => {}} />);

    // When it is submitted
    await userEvent.press(screen.getByText('Save'));

    // Then the fault is met before the field it is about
    const fault = await screen.findByText('Enter a name');
    const field = screen.getByLabelText('Name');
    const inReadingOrder = fault.parent?.children ?? [];
    expect(inReadingOrder).toContain(field);
    expect(inReadingOrder.indexOf(fault)).toBeLessThan(inReadingOrder.indexOf(field));
  });

  it('says nothing of a fault once it is put right', async () => {
    // Given a form refused for want of a name
    await render(<OneField onSubmit={() => {}} />);
    const user = userEvent.setup();
    await user.press(screen.getByText('Save'));
    await screen.findByText('Enter a name');

    // When a name is typed
    await user.type(screen.getByLabelText('Name'), 'Oats');

    // Then the fault is gone from the screen and from the field
    expect(screen.queryByText('Enter a name')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Name')).not.toHaveProp('accessibilityHint', 'Enter a name');
  });
});
