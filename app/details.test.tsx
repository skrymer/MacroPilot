import { act, fireEvent, screen, userEvent } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { ScriptedAsk } from '@/components/ScriptedAsk';
import { TestProviders } from '@/components/TestProviders';
import { ScriptedClock } from '@/lifecycle/ScriptedClock';
import { InMemoryProfileStore } from '@/storage/InMemoryProfileStore';

import Profile from './(tabs)/(profile)/profile';
import Details from './details';

/** A clock on 27 November 2026, at noon in UTC. */
const onTheDay = () => {
  const clock = new ScriptedClock();
  clock.advance(Date.UTC(2026, 10, 27, 12));
  return clock;
};

/** Opens the app at `initialUrl`, over `profile`. */
const openApp = (initialUrl: string, profile: InMemoryProfileStore, ask?: ScriptedAsk) =>
  renderRouter(
    { _layout: () => <Stack />, '(tabs)/(profile)/profile': Profile, details: Details },
    {
      initialUrl,
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders profile={profile} clock={onTheDay()} ask={ask}>
          {children}
        </TestProviders>
      ),
    },
  );

/**
 * Turns the system's date picker to `date`, as the user's finger would: it is drawn by the system, and
 * says what was chosen through its change event.
 */
const pickDate = async (user: ReturnType<typeof userEvent.setup>, date: string) => {
  await user.press(screen.getByRole('button', { name: /^Birth date, / }));
  fireEvent(screen.getByLabelText('Birth date'), 'change', {
    nativeEvent: { timestamp: Date.parse(`${date}T00:00:00Z`) },
  });
};

describe('Your details', () => {
  it('saves a profile from the way in an empty Profile offers, and shows it there', async () => {
    // Given Profile open with no details, and the form filled from there
    const profile = new InMemoryProfileStore();
    await openApp('/profile', profile);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Add your details' }));
    await user.press(screen.getByRole('radio', { name: 'Female' }));
    await pickDate(user, '1984-03-14');
    await user.type(screen.getByLabelText('Height (cm)'), '168,5');

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save profile' }));

    // Then Profile shows it, calorie tracking on, and the form is gone
    expect(await screen.findByLabelText('Sex, Female')).toBeOnTheScreen();
    expect(screen.getByLabelText('Birth date, 14 March 1984')).toBeOnTheScreen();
    expect(screen.getByLabelText('Height, 168.5 centimetres')).toBeOnTheScreen();
    // Its figure joined to its unit by a no-break space, which `\s` matches.
    expect(screen.getByText(/^168\.5\scm$/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Calorie tracking, Calories and weight')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Save profile' })).not.toBeOnTheScreen();
  });

  it('opens filled with the saved details when they are to be changed', async () => {
    // Given a profile saved, and Profile open on it
    const profile = new InMemoryProfileStore();
    await profile.save({
      sex: 'female',
      born: '1984-03-14',
      heightCm: 168.5,
      countsCalories: false,
    });
    await openApp('/profile', profile);
    const user = userEvent.setup();

    // When the user asks to change them
    await user.press(await screen.findByRole('button', { name: 'Change details' }));

    // Then the form says so, and holds each detail as it was saved
    expect(await screen.findByRole('header', { name: 'Change details' })).toBeOnTheScreen();
    expect(await screen.findByDisplayValue('168.5')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Female' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Weight only' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Birth date, 14 March 1984' })).toBeOnTheScreen();
  });

  it('asks before changed details are left, and leaves them as they were once told to', async () => {
    // Given the saved details opened to be changed, a height changed, and the form left
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    const ask = new ScriptedAsk();
    await openApp('/profile', profile, ask);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Change details' }));
    await user.clear(await screen.findByLabelText('Height (cm)'));
    await user.type(screen.getByLabelText('Height (cm)'), '182');
    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(ask.question).toEqual({ title: 'Discard these changes?', loses: 'Discard' });

    // When the user says to discard them
    await act(async () => ask.answer(true));

    // Then Profile shows the details as they were
    expect(await screen.findByLabelText('Height, 181 centimetres')).toBeOnTheScreen();
    expect((await profile.read())?.heightCm).toBe(181);
  });

  it('keeps what was given when the save fails, and says so above the button', async () => {
    // Given the form filled over a store that cannot be written
    const profile = new InMemoryProfileStore();
    profile.unwritable = true;
    await openApp('/details', profile);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('radio', { name: 'Male' }));
    await pickDate(user, '1990-01-02');
    await user.type(screen.getByLabelText('Height (cm)'), '181');

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save profile' }));

    // Then the form stays, filled, and says it was not saved
    expect(
      await screen.findByText('Could not save your details. What you gave is still here.'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Height (cm)')).toHaveDisplayValue('181');
    expect(screen.getByRole('radio', { name: 'Male' })).toBeChecked();
  });

  it.each([
    ['300', 'Enter a height above 0 and below 300 cm'],
    ['0', 'Enter a height above 0 and below 300 cm'],
    ['1.5.0', 'Enter a number'],
  ])('refuses a height of %s beside its field', async (typed, why) => {
    // Given the form open
    const profile = new InMemoryProfileStore();
    await openApp('/details', profile);
    const user = userEvent.setup();

    // When the height is typed and left
    await user.type(await screen.findByLabelText('Height (cm)'), typed);
    await user.press(screen.getByRole('radio', { name: 'Male' }));

    // Then the field says why
    expect(await screen.findByText(why)).toBeOnTheScreen();
  });

  it('refuses a birth date from today, should the picker give one', async () => {
    // Given the form open
    const profile = new InMemoryProfileStore();
    await openApp('/details', profile);
    const user = userEvent.setup();
    await screen.findByRole('button', { name: 'Save profile' });

    // When today is chosen and the form saved
    await pickDate(user, '2026-11-27');
    await user.press(screen.getByRole('button', { name: 'Save profile' }));

    // Then the field says why
    expect(
      await screen.findByText('Choose a birth date before today, within the last 120 years'),
    ).toBeOnTheScreen();
  });

  it('keeps calorie tracking off when the user chooses weight only', async () => {
    // Given the form filled, and weight only chosen
    const profile = new InMemoryProfileStore();
    await openApp('/details', profile);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('radio', { name: 'Male' }));
    await pickDate(user, '1990-01-02');
    await user.type(screen.getByLabelText('Height (cm)'), '181');
    await user.press(screen.getByRole('radio', { name: 'Weight only' }));

    // When the user saves it
    await user.press(screen.getByRole('button', { name: 'Save profile' }));

    // Then it is kept so
    expect(await screen.findByLabelText('Calorie tracking, Weight only')).toBeOnTheScreen();
    expect(await profile.read()).toEqual({
      sex: 'male',
      born: '1990-01-02',
      heightCm: 181,
      countsCalories: false,
    });
  });

  it('opens with nothing chosen, the wheels shut, and says it adds the details', async () => {
    // Given no profile saved
    const profile = new InMemoryProfileStore();

    // When the form opens
    await openApp('/details', profile);

    // Then it says what it does, and that no birth date is chosen, without the picker open
    expect(await screen.findByRole('header', { name: 'Add your details' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Birth date, not chosen' })).toBeOnTheScreen();
    expect(screen.queryByLabelText('Birth date')).not.toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Male' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Female' })).not.toBeChecked();
  });

  it('opens the wheels on the saved birth date, and leaves a form untouched without asking', async () => {
    // Given the saved details opened to be changed, and the birth date's wheels opened and shut
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    const ask = new ScriptedAsk();
    await openApp('/profile', profile, ask);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Change details' }));
    const field = await screen.findByRole('button', { name: 'Birth date, 14 March 1984' });
    expect(screen.queryByLabelText('Birth date')).not.toBeOnTheScreen();
    await user.press(field);
    expect(screen.getByLabelText('Birth date')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Birth date, 14 March 1984' }));
    expect(screen.queryByLabelText('Birth date')).not.toBeOnTheScreen();

    // When the user leaves it
    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    // Then nothing is asked, and Profile shows the details as they were
    expect(await screen.findByLabelText('Birth date, 14 March 1984')).toBeOnTheScreen();
    expect(ask.question).toBeUndefined();
  });

  it('says the saved details could not be read, with the way out and a retry', async () => {
    // Given a profile saved in a store that cannot be read
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    profile.unreadable = true;

    // When the form opens
    await openApp('/details', profile);

    // Then it says so, offers to leave, and to try again, which opens the form filled
    expect(await screen.findByText('Couldn’t load your details')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeOnTheScreen();
    profile.unreadable = false;
    await userEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('header', { name: 'Change details' })).toBeOnTheScreen();
  });

  it('chooses no birth date when the wheels are only opened and shut', async () => {
    // Given the empty form, its birth date's wheels opened
    const profile = new InMemoryProfileStore();
    await openApp('/details', profile);
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Birth date, not chosen' }));

    // When they are shut without being turned
    await user.press(screen.getByRole('button', { name: /^Birth date, / }));

    // Then no date is chosen
    expect(screen.queryByRole('button', { name: 'Birth date, not chosen' })).toBeOnTheScreen();
  });

  it('refuses a form with nothing given, and says what each field needs', async () => {
    // Given the form open with nothing in it
    const profile = new InMemoryProfileStore();
    await openApp('/details', profile);
    const user = userEvent.setup();

    // When the user saves it
    await user.press(await screen.findByRole('button', { name: 'Save profile' }));

    // Then nothing is kept, and each field and the button say why
    expect(await screen.findByText('Choose your sex')).toBeOnTheScreen();
    expect(screen.getByText('Choose your birth date')).toBeOnTheScreen();
    expect(screen.getByText('Enter your height in cm')).toBeOnTheScreen();
    expect(screen.getByText('Not saved. A field above needs changing.')).toBeOnTheScreen();
    expect(await profile.read()).toBeUndefined();
  });
});
