import type { Ask, Question } from './Ask';

/** For tests: an `Ask` whose question stays up until the test answers it. */
export class ScriptedAsk implements Ask {
  /** The question that is up. */
  question?: Question;
  private settle: (goesOn: boolean) => void = () => {};

  ask(question: Question): Promise<boolean> {
    this.question = question;
    return new Promise((resolve) => {
      this.settle = resolve;
    });
  }

  /** Answers the question that is up, which goes. */
  answer(goesOn: boolean): void {
    this.question = undefined;
    this.settle(goesOn);
  }
}
