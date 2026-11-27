import type { Profile } from '@/domain/profile';

/** The user's one Profile. A call that fails rejects, and has changed nothing. */
export interface ProfileStore {
  /** Undefined until one is saved. */
  read(): Promise<Profile | undefined>;
  /** Replaces the one saved before. */
  save(profile: Profile): Promise<void>;
}
