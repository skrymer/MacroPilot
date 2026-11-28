import { dailyDeficit, isRate, isSuspended, isTarget, leavesFood, newGoal, ratePast } from './goal';

describe('newGoal', () => {
  it('starts from the trend weight on the day it is set', () => {
    // Given a trend weight of 82.4 kg and a maintenance of 2529 kcal

    // When a goal of 75 kg at 0.5 kg a week is set on 28 November 2026
    const goal = newGoal(
      { targetKg: 75, rateKgPerWeek: 0.5 },
      { trendKg: 82.4, maintenanceKcal: 2529 },
      '2026-11-28',
    );

    // Then it starts at the trend, that day
    expect(goal).toEqual({ setOn: '2026-11-28', startKg: 82.4, targetKg: 75, rateKgPerWeek: 0.5 });
  });

  it('refuses a target not below the trend weight', () => {
    // Given a trend weight of 82.4 kg

    // When a goal of 82.4 kg is set
    const setting = () =>
      newGoal(
        { targetKg: 82.4, rateKgPerWeek: 0.5 },
        { trendKg: 82.4, maintenanceKcal: 2529 },
        '2026-11-28',
      );

    // Then it is refused
    expect(setting).toThrow('A Goal needs a target above 0 and below the Trend Weight');
  });

  it('refuses a rate faster than 1.5 kg a week', () => {
    // Given a trend weight of 82.4 kg

    // When a goal at 1.51 kg a week is set
    const setting = () =>
      newGoal(
        { targetKg: 75, rateKgPerWeek: 1.51 },
        { trendKg: 82.4, maintenanceKcal: 2529 },
        '2026-11-28',
      );

    // Then it is refused
    expect(setting).toThrow('A rate is from 0.05 to 1.5 kg a week');
  });

  it('refuses a rate whose deficit would reach maintenance', () => {
    // Given a maintenance of 1100 kcal a day

    // When a goal at 1 kg a week (1100 kcal a day) is set
    const setting = () =>
      newGoal(
        { targetKg: 75, rateKgPerWeek: 1 },
        { trendKg: 82.4, maintenanceKcal: 1100 },
        '2026-11-28',
      );

    // Then it is refused
    expect(setting).toThrow('A rate whose deficit reaches maintenance leaves nothing to eat');
  });
});

describe('isSuspended', () => {
  it('suspends a running Goal whose deficit reaches the maintenance, and nothing without a Goal', () => {
    // Given a Goal of 1.4 kg a week, a deficit of 1540 kcal a day
    const goal = { setOn: '2026-11-20', startKg: 50, targetKg: 45, rateKgPerWeek: 1.4 };

    // When it is judged at maintenances either side of its deficit, and with no Goal
    const judged = [1539, 1540, 1541].map((maintenance) => isSuspended(goal, maintenance));
    const without = isSuspended(undefined, 1000);

    // Then it is suspended up to and at its deficit, not past it; and never without a Goal
    expect(judged).toEqual([true, true, false]);
    expect(without).toBe(false);
  });
});

describe('leavesFood', () => {
  it('refuses a rate whose deficit reaches maintenance, exactly at it included', () => {
    // Given a maintenance of 550 kcal a day

    // When a rate under it (0.45 kg a week, 495 kcal) and one exactly at it (0.5, 550) are judged
    const judged = [0.45, 0.5].map((rate) => leavesFood(rate, 550));

    // Then only the first leaves anything to eat
    expect(judged).toEqual([true, false]);
  });
});

describe('isTarget', () => {
  it('takes a target above 0 and below the trend weight, neither end included', () => {
    // Given a trend weight of 82.4 kg, and targets either side of 0 and of it

    // When each is judged
    const judged = [0, 0.1, 82.3, 82.4].map((target) => isTarget(target, 82.4));

    // Then only those strictly between are targets
    expect(judged).toEqual([false, true, true, false]);
  });
});

describe('isRate', () => {
  it('takes a rate from 0.05 to 1.5 kg a week, both ends included', () => {
    // Given rates either side of each end

    // When each is judged
    const judged = [0.04, 0.05, 1.5, 1.51].map(isRate);

    // Then only the ends and what lies between are rates
    expect(judged).toEqual([false, true, true, false]);
  });
});

describe('ratePast', () => {
  it('says which end a rate is past, and nothing of a rate at an end or between', () => {
    // Given rates either side of each end

    // When each is judged
    const judged = [0.04, 0.05, 1.5, 1.51].map(ratePast);

    // Then the slow one is past the least, the fast one past the most
    expect(judged).toEqual(['least', undefined, undefined, 'most']);
  });
});

describe('dailyDeficit', () => {
  it('spreads a week’s loss over its days, at 7700 kcal a kilo', () => {
    // Given a rate of 0.5 kg a week

    // When its daily deficit is asked
    const deficit = dailyDeficit(0.5);

    // Then it is 550 kcal
    expect(deficit).toBe(550);
  });
});
