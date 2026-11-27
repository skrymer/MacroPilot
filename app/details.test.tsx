import { fireEvent, screen, userEvent } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

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
const openApp = (initialUrl: string, profile: InMemoryProfileStore) =>
  renderRouter(
    { _layout: () => <Stack />, '(tabs)/(profile)/profile': Profile, details: Details },
    {
      initialUrl,
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders profile={profile} clock={onTheDay()}>
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
    expect(screen.getByLabelText('Calorie tracking, Calories and weight')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Save profile' })).not.toBeOnTheScreen();
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
