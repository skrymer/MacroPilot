import type { WeighIn } from '@/domain/weighIn';

import type { WeighInStore } from './WeighInStore';

/** For tests: a `WeighInStore` that forgets, and can be made to fail as a phone's storage would. */
export class InMemoryWeighInStore implements WeighInStore {
  unreadable = false;
  unwritable = false;
  private weighIns = new Map<string, WeighIn>();

  async save(weighIn: WeighIn): Promise<void> {
    if (this.unwritable) throw new Error('The weigh-ins cannot be written');
    this.weighIns.set(weighIn.day, weighIn);
  }

  async list(): Promise<WeighIn[]> {
    if (this.unreadable) throw new Error('The weigh-ins cannot be read');
    return [...this.weighIns.values()].sort((a, b) => a.day.localeCompare(b.day));
  }
}
