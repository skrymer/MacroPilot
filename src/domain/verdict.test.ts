import { againstBudget, dayVerdict } from './verdict';

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
