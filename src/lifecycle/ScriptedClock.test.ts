import { ScriptedClock } from './ScriptedClock';

describe('ScriptedClock', () => {
  it('tells the time it has been moved on to', () => {
    // Given a scripted clock, which starts at zero
    const clock = new ScriptedClock();

    // When a minute passes
    clock.advance(60_000);

    // Then it reads a minute
    expect(clock.now()).toBe(60_000);
  });

  it('reads the phone as however far ahead of UTC it was set', () => {
    // Given a scripted clock
    const clock = new ScriptedClock();

    // When the phone is set an hour ahead of UTC
    clock.setUtcOffset(60);

    // Then any time reads an hour ahead
    expect(clock.utcOffsetMinutes(0)).toBe(60);
  });

  it('runs a scheduled call once its time has come, at that time', () => {
    // Given a call scheduled a minute ahead
    const clock = new ScriptedClock();
    const calls: number[] = [];
    clock.after(60_000, () => calls.push(clock.now()));

    // When two minutes pass
    clock.advance(120_000);

    // Then it ran once, reading the minute it was due
    expect(calls).toEqual([60_000]);
  });

  it('counts no time it slept towards a call, as a phone in deep sleep does not', () => {
    // Given a call due in a minute, and an hour slept through
    const clock = new ScriptedClock();
    const calls: number[] = [];
    clock.after(60_000, () => calls.push(clock.now()));
    clock.sleep(3_600_000);
    clock.advance(59_999);
    expect(calls).toEqual([]);

    // When the rest of its minute goes by
    clock.advance(1);

    // Then the call ran, an hour late
    expect(calls).toEqual([3_660_000]);
  });

  it('runs the calls that fall due in the order they fall due, and leaves the rest', () => {
    // Given calls scheduled two minutes, one minute and five minutes ahead
    const clock = new ScriptedClock();
    const calls: string[] = [];
    clock.after(120_000, () => calls.push(`two at ${clock.now()}`));
    clock.after(60_000, () => calls.push(`one at ${clock.now()}`));
    clock.after(300_000, () => calls.push(`five at ${clock.now()}`));

    // When three minutes pass
    clock.advance(180_000);

    // Then the one-minute call ran first, each at its own time, and the five-minute call waits
    expect(calls).toEqual(['one at 60000', 'two at 120000']);
  });

  it('never runs a call that was cancelled', () => {
    // Given a call scheduled a minute ahead, then cancelled
    const clock = new ScriptedClock();
    const call = jest.fn();
    const cancel = clock.after(60_000, call);
    cancel();

    // When the minute passes
    clock.advance(60_000);

    // Then the call never ran
    expect(call).not.toHaveBeenCalled();
  });

  it('cancels only the call it was given for', () => {
    // Given two calls a minute ahead, the first then cancelled
    const clock = new ScriptedClock();
    const cancelled = jest.fn();
    const kept = jest.fn();
    const cancel = clock.after(60_000, cancelled);
    clock.after(60_000, kept);
    cancel();

    // When the minute passes
    clock.advance(60_000);

    // Then the other call still ran
    expect(kept).toHaveBeenCalledTimes(1);
  });
});
