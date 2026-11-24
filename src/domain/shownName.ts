/** Judged on each word, not on the name, so that a name shown is shown again as itself. */
const isInitialism = (word: string) =>
  word.replace(/\P{L}/gu, '').length <= 3 && word === word.toUpperCase();

/**
 * A name in sentence case. It is only ever shown: what was typed is what is kept.
 *
 * A word with a digit is left alone. So is a short initialism, where lower case beside it shows that
 * it is one: in a name that is all capitals nothing stands out, and `UHT MILK` is `Uht milk`.
 */
export function shownName(name: string): string {
  const shouted = name === name.toUpperCase();
  const stated = name
    .trim()
    .split(/(\s+)/)
    .map((word) =>
      /\d/.test(word) || (!shouted && isInitialism(word)) ? word : word.toLowerCase(),
    )
    .join('');
  return stated.replace(/^[^\p{L}\p{N}]*\p{L}/u, (opening) => opening.toUpperCase());
}
