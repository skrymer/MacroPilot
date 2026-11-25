/** What is asked before something is lost. It is answered `loses`, or *Cancel*. */
export type Question = { title: string; message?: string; loses: 'Delete' | 'Discard' };

/** The system's own question, over the page it came from. */
export interface Ask {
  /** True where the user said to go on. Put away without an answer, it is *Cancel*. */
  ask(question: Question): Promise<boolean>;
}
