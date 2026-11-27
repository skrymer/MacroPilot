import { missingForSetup } from './setup';

const PROFILE = { sex: 'male', born: '1984-03-14', heightCm: 181, countsCalories: true } as const;
const WEIGH_IN = { day: '2026-11-27', kg: 82 };

describe('missingForSetup', () => {
  it.each([
    ['nothing', undefined, [], ['details', 'weigh-in']],
    ['a weigh-in alone', undefined, [WEIGH_IN], ['details']],
    ['a profile alone', PROFILE, [], ['weigh-in']],
    ['both', PROFILE, [WEIGH_IN], []],
  ] as const)('names what is still missing with %s', (_, profile, weighIns, missing) => {
    // Given a profile or none, and weigh-ins or none

    // When Setup is judged
    const judged = missingForSetup(profile, weighIns);

    // Then what is missing is named, and nothing once it is complete
    expect(judged).toEqual(missing);
  });
});
