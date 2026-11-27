import { dayVerdict } from './verdict';

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
});
