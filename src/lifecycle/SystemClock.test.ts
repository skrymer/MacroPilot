import { SystemClock } from './SystemClock';

describe('SystemClock', () => {
  beforeEach(() => jest.useFakeTimers({ now: 1_000_000 }));
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('runs a scheduled call once its time has passed on the phone', () => {
    // Given a call scheduled a minute ahead on the phone's clock
    const clock = new SystemClock();
    const calls: number[] = [];
    clock.after(60_000, () => calls.push(clock.now()));

    // When a minute passes
    jest.advanceTimersByTime(60_000);

    // Then it ran, a minute on from when it was scheduled
    expect(calls).toEqual([1_060_000]);
  });

  it('never runs a call that was cancelled', () => {
    // Given a call scheduled a minute ahead, then cancelled
    const clock = new SystemClock();
    const call = jest.fn();
    const cancel = clock.after(60_000, call);
    cancel();

    // When a minute passes
    jest.advanceTimersByTime(60_000);

    // Then the call never ran
    expect(call).not.toHaveBeenCalled();
  });

  it('reads how far ahead of UTC the phone’s clock was at a time, summer time included', () => {
    // Given a phone in Copenhagen, which JavaScript gives as minutes behind UTC: -60, -120 in summer
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(function (this: Date) {
      return this.getUTCMonth() === 6 ? -120 : -60;
    });
    const clock = new SystemClock();

    // When it is asked for the offset in January and in July
    const offsets = [Date.UTC(2026, 0, 15), Date.UTC(2026, 6, 15)].map((at) =>
      clock.utcOffsetMinutes(at),
    );

    // Then it reads an hour ahead, then two
    expect(offsets).toEqual([60, 120]);
  });
});
