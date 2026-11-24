import { createContext, useContext } from 'react';
import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { FONT_SCALE_CAPS } from './fontScaleCaps';

/** `text-figure` → 1, and so on: the caps keyed by the class that sets each size. */
const CAP_BY_CLASS = new Map(
  Object.entries(FONT_SCALE_CAPS).map(([size, cap]) => [`text-${size}`, cap]),
);

/** The class a variant like `ios:` or `active:` applies, without the variant. */
const withoutVariant = (name: string) => name.slice(name.lastIndexOf(':') + 1);

/** The strictest cap among the class list's size tokens; undefined when it names no size. */
export const ownCap = (className = '') => {
  const caps = className
    .split(/\s+/)
    .flatMap((name) => CAP_BY_CLASS.get(withoutVariant(name)) ?? []);
  return caps.length > 0 ? Math.min(...caps) : undefined;
};

/**
 * The cap of the enclosing text. A nested span with no size token inherits the
 * enclosing font size, so it inherits the cap that goes with it.
 */
const InheritedCap = createContext<number>(2);

/** The cap is the size token's to set, so a caller cannot pass one. */
export type TextProps = Omit<NativeTextProps, 'maxFontSizeMultiplier'> & { className?: string };

/**
 * The app's only text component (ADR 0007). A figure token never scales with
 * Larger Text; everything else, including text with no size token, scales to
 * double and stops. A span with no size token takes its enclosing text's cap.
 */
export function Text(props: TextProps) {
  const inherited = useContext(InheritedCap);
  const cap = ownCap(props.className) ?? inherited;
  return (
    <InheritedCap.Provider value={cap}>
      <NativeText {...props} maxFontSizeMultiplier={cap} />
    </InheritedCap.Provider>
  );
}
