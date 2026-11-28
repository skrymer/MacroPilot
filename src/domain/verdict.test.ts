import { againstBudget, againstFloor, dayVerdict, overLine } from './verdict';

const TARGETS = { budgetKcal: 2000, proteinFloorG: 150 };
const day = (calories: number, protein: number | undefined) => ({
  calories,
  protein,
  proteinStated: protein === undefined ? ('none' as const) : ('all' as const),
  estimated: false,
});

describe('dayVerdict', () => {
  it('is over budget past the budget and its tenth', () => {
    // Given a budget of 2000 kcal

    // When a day of 2200.1 kcal is judged
    const verdict = dayVerdict(day(2200.1, 200), TARGETS);

    // Then it is over budget
    expect(verdict).toBe('over budget');
  });

  it('is only slightly over at exactly the budget and its tenth', () => {
    // Given a budget of 2000 kcal

    // When a day of exactly 2200 kcal is judged
    const verdict = dayVerdict(day(2200, 200), TARGETS);

    // Then it is slightly over
    expect(verdict).toBe('slightly over');
  });

  it('is on target at exactly the budget, once protein reaches exactly the floor', () => {
    // Given a budget of 2000 kcal and a floor of 150 g

    // When a day of exactly 2000 kcal and 150 g is judged
    const verdict = dayVerdict(day(2000, 150), TARGETS);

    // Then it is on target
    expect(verdict).toBe('on target');
  });

  it('counts protein that is at least the floor, and not protein nobody stated', () => {
    // Given a budget of 2000 kcal and a floor of 150 g

    // When a day with at least 160 g, and a day with protein not stated, are judged
    const judged = [
      dayVerdict({ ...day(1500, 160), proteinStated: 'some' }, TARGETS),
      dayVerdict(day(1500, undefined), TARGETS),
    ];

    // Then the first is on target and the second in progress
    expect(judged).toEqual(['on target', 'in progress']);
  });

  it('never counts protein nobody stated as reaching a floor, even one of 0 g', () => {
    // Given a budget of 2000 kcal and a floor of 0 g

    // When a day with protein not stated is judged
    const verdict = dayVerdict(day(1500, undefined), { budgetKcal: 2000, proteinFloorG: 0 });

    // Then it is in progress, its protein not yet known to reach anything
    expect(verdict).toBe('in progress');
  });
});

describe('overLine', () => {
  it.each([
    [1500, 500, undefined],
    [1500, 501, { overKcal: 1, standing: 'slightly over' }],
    [1500, 700, { overKcal: 200, standing: 'slightly over' }],
    [1500, 700.1, { overKcal: 200.1, standing: 'over budget' }],
    [1500, undefined, undefined],
  ])('with %s kcal logged and %s typed, against 2000: %o', (dayKcal, entryKcal, expected) => {
    // Given a day of dayKcal against a budget of 2000 kcal

    // When an entry of entryKcal is being typed
    const line = overLine(dayKcal, entryKcal, 2000);

    // Then nothing at or under the budget; slightly over to its tenth; over budget past it
    if (expected === undefined) expect(line).toBeUndefined();
    else {
      expect(line?.standing).toBe(expected.standing);
      expect(line?.overKcal).toBeCloseTo(expected.overKcal, 10);
    }
  });
});

describe('againstBudget', () => {
  it('says how much is left, unrounded, and the share of the budget eaten', () => {
    // Given a budget of 2000 kcal

    // When a day of 1176 kcal is set against it
    const standing = againstBudget(1176, 2000);

    // Then 824 kcal are left, and 58.8% is eaten
    expect(standing).toEqual({ kcal: 824, over: false, share: 0.588 });
  });

  it('says how far past the budget a day is, with all of the budget eaten', () => {
    // Given a budget of 2000 kcal

    // When a day of 2200 kcal is set against it
    const standing = againstBudget(2200, 2000);

    // Then it is 200 kcal over, and the whole budget is eaten
    expect(standing).toEqual({ kcal: 200, over: true, share: 1 });
  });
});

describe('againstFloor', () => {
  it('says how much protein is still to go, and the share of the floor reached', () => {
    // Given a floor of 132 g

    // When a day whose every entry states its protein, 63 g in all, is set against it
    const standing = againstFloor({ protein: 63, proteinStated: 'all' }, 132);

    // Then 69 g are to go, and 63/132 of the floor is reached
    expect(standing).toEqual({ standing: 'to go', grams: 69, share: 63 / 132 });
  });

  it('meets the floor at exactly the floor, the whole of it reached', () => {
    // Given a floor of 132 g

    // When a day of exactly 132 g, every entry stating it, is set against it
    const standing = againstFloor({ protein: 132, proteinStated: 'all' }, 132);

    // Then the floor is met
    expect(standing).toEqual({ standing: 'met', share: 1 });
  });

  it('says what is known of protein some entries left out, and never what is to go', () => {
    // Given a floor of 132 g

    // When a day where only some entries state protein, 40 g of them, is set against it
    const standing = againstFloor({ protein: 40, proteinStated: 'some' }, 132);

    // Then at least 40 g are known, the share drawn to them
    expect(standing).toEqual({ standing: 'at least', grams: 40, share: 40 / 132 });
  });

  it('says protein nobody stated is not stated, never 0 g and never what is to go', () => {
    // Given a floor of 132 g

    // When a day whose entries state no protein is set against it
    const standing = againstFloor({ protein: undefined, proteinStated: 'none' }, 132);

    // Then it is not stated, and nothing is drawn
    expect(standing).toEqual({ standing: 'not stated', share: 0 });
  });

  it('meets the floor with at least as much as it, though some entries left protein out', () => {
    // Given a floor of 132 g

    // When a day where only some entries state protein, 140 g of them, is set against it
    const standing = againstFloor({ protein: 140, proteinStated: 'some' }, 132);

    // Then the floor is met, at least that being enough
    expect(standing).toEqual({ standing: 'met', share: 1 });
  });

  it('says an empty day has the whole floor to go, its 0 g known', () => {
    // Given a floor of 132 g

    // When a day with nothing logged, 0 g known, is set against it
    const standing = againstFloor({ protein: 0, proteinStated: 'all' }, 132);

    // Then all 132 g are to go, and nothing is drawn
    expect(standing).toEqual({ standing: 'to go', grams: 132, share: 0 });
  });

  it('judges protein in grams free of the arithmetic’s noise, as they were logged', () => {
    // Given a floor of 124 g that a trend's arithmetic left as 124.00000000000001

    // When a day of 100 g, every entry stating it, is set against it
    const standing = againstFloor({ protein: 100, proteinStated: 'all' }, 124.00000000000001);

    // Then exactly 24 g are to go
    expect(standing).toEqual({ standing: 'to go', grams: 24, share: 100 / 124 });
  });
});
