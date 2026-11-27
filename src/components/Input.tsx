import { TextInput, type TextInputProps } from 'react-native';

import { ownCap } from './Text';

/** The cap is the size token's to set, so a caller cannot pass one. */
export type InputProps = Omit<TextInputProps, 'maxFontSizeMultiplier'> & { className?: string };

/**
 * The app's only text field: React Native's own, the platform's native field on iOS and Android,
 * its type capped by its size token as `Text`'s is (ADR 0007).
 */
export function Input(props: InputProps) {
  return (
    <TextInput
      underlineColorAndroid="transparent"
      // A native field sets text low and clipped under a line height on iOS, and off centre under
      // the font's padding on Android, so it takes neither.
      style={{ lineHeight: undefined, includeFontPadding: false, textAlignVertical: 'center' }}
      {...props}
      maxFontSizeMultiplier={ownCap(props.className) ?? 2}
      // Its fill and outline are the caller's, since they say how the field stands.
      className={`min-h-target rounded-2xl px-3 text-ink placeholder:text-ink-mid ${props.className ?? ''}`}
    />
  );
}
