import { act, screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { TestProviders } from '@/components/TestProviders';
import { InMemoryProfileStore } from '@/storage/InMemoryProfileStore';

import TabsLayout from '../_layout';
import ProfileStack from './_layout';
import Profile from './profile';

/** Opens the app on Profile, over `profile`. */
const openProfile = (profile: InMemoryProfileStore) =>
  renderRouter(
    {
      '(tabs)/_layout': TabsLayout,
      '(tabs)/(today)/index': () => null,
      '(tabs)/(log)/log': () => null,
      '(tabs)/(foods)/foods': () => null,
      '(tabs)/(profile)/_layout': ProfileStack,
      '(tabs)/(profile)/profile': Profile,
      '(tabs)/developer': () => null,
    },
    {
      initialUrl: '/profile',
      wrapper: ({ children }: { children: ReactNode }) => (
        <TestProviders profile={profile}>{children}</TestProviders>
      ),
    },
  );

describe('Profile', () => {
  it('says what to add before there are any details, and never shows an empty form', async () => {
    // Given no profile saved
    const profile = new InMemoryProfileStore();

    // When the user opens Profile
    await openProfile(profile);

    // Then it says what the details are for, and the way to add them
    expect(await screen.findByText('No details yet')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Your sex, birth date and height set your first calorie budget and protein floor.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add your details' })).toBeOnTheScreen();
    expect(screen.queryByLabelText('Height (cm)')).not.toBeOnTheScreen();
  });

  it('says nothing before the profile is read, not even that there is none', async () => {
    // Given a profile saved, whose read has not come back
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    const release = profile.holdNextRead();

    // When the user opens Profile
    await openProfile(profile);

    // Then it says nothing until the read comes back with the details
    expect(await screen.findByRole('header', { name: 'Profile' })).toBeOnTheScreen();
    expect(screen.queryByText('No details yet')).not.toBeOnTheScreen();
    await act(async () => release());
    expect(await screen.findByLabelText('Sex, Male')).toBeOnTheScreen();
  });

  it('says a profile that cannot be read could not be, and reads it again when asked', async () => {
    // Given a profile saved in a store that cannot be read, and Profile open on it
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });
    profile.unreadable = true;
    await openProfile(profile);
    expect(await screen.findByText('Couldn’t load your profile')).toBeOnTheScreen();
    expect(screen.queryByText('No details yet')).not.toBeOnTheScreen();
    profile.unreadable = false;

    // When the user asks to try again
    await userEvent.press(screen.getByRole('button', { name: 'Retry' }));

    // Then the details are shown
    expect(await screen.findByLabelText('Sex, Male')).toBeOnTheScreen();
  });

  it('shows a saved profile as rows under its heading, each read out as one', async () => {
    // Given a profile saved
    const profile = new InMemoryProfileStore();
    await profile.save({ sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true });

    // When the user opens Profile
    await openProfile(profile);

    // Then each detail is a row, and the way to change them is under them
    expect(await screen.findByRole('header', { name: 'Your details' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Sex, Male')).toBeOnTheScreen();
    expect(screen.getByLabelText('Birth date, 14 March 1984')).toBeOnTheScreen();
    expect(screen.getByLabelText('Height, 181 centimetres')).toBeOnTheScreen();
    expect(screen.getByLabelText('Calorie tracking, Calories and weight')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Change details' })).toBeOnTheScreen();
    expect(screen.queryByText('No details yet')).not.toBeOnTheScreen();
  });
});
