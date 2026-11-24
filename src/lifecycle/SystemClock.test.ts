import { SystemClock } from './SystemClock';

/** Dates are formatted in `zone` where none is asked for, as on a phone that is there. */
const phoneIn = (zone: string) => {
  const { DateTimeFormat } = Intl;
  jest
    .spyOn(Intl, 'DateTimeFormat')
    .mockImplementation(
      (locale, options) => new DateTimeFormat(locale, { timeZone: zone, ...options }),
    );
};

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
    // Given a phone in Copenhagen
    phoneIn('Europe/Copenhagen');
    const clock = new SystemClock();

    // When it is asked for the offset in January and in July
    const offsets = [Date.UTC(2026, 0, 15), Date.UTC(2026, 6, 15)].map((at) =>
      clock.utcOffsetMinutes(at),
    );

    // Then it reads an hour ahead, then two
    expect(offsets).toEqual([60, 120]);
  });

  it('reads how far ahead of UTC the phone was at its own midnight', () => {
    // Given a phone in Brisbane
    phoneIn('Australia/Brisbane');
    const clock = new SystemClock();

    // When it is asked for the offset at midnight there
    const offset = clock.utcOffsetMinutes(Date.UTC(2026, 10, 24, 14));

    // Then it is ten hours, and not a day short of it
    expect(offset).toBe(600);
  });

  it('reads the zone the phone has been taken to, which a Date keeps to the one the app opened in', () => {
    // Given an app opened in Brisbane, and a phone now in Los Angeles
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-600);
    phoneIn('America/Los_Angeles');
    const clock = new SystemClock();

    // When it is asked for the offset in November
    const offset = clock.utcOffsetMinutes(Date.UTC(2026, 10, 24, 22, 6, 30, 250));

    // Then it is Los Angeles's
    expect(offset).toBe(-480);
  });
});
