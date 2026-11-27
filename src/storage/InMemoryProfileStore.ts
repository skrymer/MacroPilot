import type { Profile } from '@/domain/profile';

import { held } from './held';
import type { ProfileStore } from './ProfileStore';

/** For tests: a `ProfileStore` that forgets, and can be made to fail or wait as a phone's storage would. */
export class InMemoryProfileStore implements ProfileStore {
  unreadable = false;
  unwritable = false;
  private readable: Promise<void> = Promise.resolve();
  private profile?: Profile;

  /** The next read waits until what this gives back is called, and then says what it would have. */
  holdNextRead(): () => void {
    const { until, release } = held();
    this.readable = until;
    return release;
  }

  async read(): Promise<Profile | undefined> {
    const { profile, readable } = this;
    this.readable = Promise.resolve();
    await readable;
    if (this.unreadable) throw new Error('The profile cannot be read');
    return profile;
  }

  async save(profile: Profile): Promise<void> {
    if (this.unwritable) throw new Error('The profile cannot be written');
    this.profile = profile;
  }
}
