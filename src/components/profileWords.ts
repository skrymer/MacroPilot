/** The answers a Profile's sex is chosen from, as they are shown. */
export const SEXES = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
] as const;

/** Two named answers rather than a switch: off is a way of using the app, not a setting turned down. */
export const TRACKING = [
  {
    label: 'Calories and weight',
    value: true,
    detail: 'Log what you eat against a calorie budget and a protein floor.',
  },
  {
    label: 'Weight only',
    value: false,
    detail: 'Weigh in and track your goal. MacroPilot never asks what you ate.',
  },
] as const;

/** The words of the answer that is `value`. */
export const wordsOf = <Value>(answers: readonly { label: string; value: Value }[], value: Value) =>
  answers.find((answer) => answer.value === value)?.label ?? '';
