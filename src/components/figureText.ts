import { z } from 'zod';

import { isAmount } from '@/domain/food';

/** Digits with at most one decimal mark, which is a point or a comma: many keyboards give a comma. */
const FIGURE = /^-?([0-9]+[.,]?[0-9]*|[.,][0-9]+)$/;

/** `1,500`: some mean fifteen hundred by it, and some one and a half. */
const THOUSAND_OR_DECIMAL = /,[0-9]{3}$/;

/** What a field's text says. Blank is not stated, which is not zero. */
export const optionalFigure = z.string().transform((text, context): number | undefined => {
  const typed = text.trim();
  if (typed === '') return undefined;
  const decimal = Number(typed.replace(',', '.'));
  if (!FIGURE.test(typed) || !Number.isFinite(decimal)) {
    context.addIssue('Enter a number');
    return z.NEVER;
  }
  if (THOUSAND_OR_DECIMAL.test(typed)) {
    context.addIssue(`Did you mean ${Number(typed.replace(',', ''))} or ${decimal}?`);
    return z.NEVER;
  }
  // `-0` is 0, and would be shown with its minus.
  return decimal + 0;
});

/** The same, of something there can be none of but not less. */
export const optionalAmount = (name: string) =>
  optionalFigure.refine((figure) => figure === undefined || isAmount(figure), {
    error: `${name} can’t be negative`,
    abort: true,
  });
