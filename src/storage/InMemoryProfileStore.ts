import type { Profile } from '@/domain/profile';

import type { ProfileStore } from './ProfileStore';

/** For tests: a `ProfileStore` that forgets, and can be made to fail as a phone's storage would. */
export class InMemoryProfileStore implements ProfileStore {
  unreadable = false;
  unwritable = false;
  private profile?: Profile;

  async read(): Promise<Profile | undefined> {
    if (this.unreadable) throw new Error('The profile cannot be read');
    return this.profile;
  }

  async save(profile: Profile): Promise<void> {
    if (this.unwritable) throw new Error('The profile cannot be written');
    this.profile = profile;
  }
}
