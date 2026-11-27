import { SymbolView } from 'expo-symbols';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { View, type KeyboardTypeOptions } from 'react-native';

import { fieldLook } from './fieldLook';
import { Input } from './Input';
import { Text } from './Text';
import { useTint } from './useTint';

type FormFieldProps<Typed extends FieldValues, Said> = {
  control: Control<Typed, unknown, Said>;
  name: Path<Typed>;
  label: string;
  /** An example of what goes in it, gone as soon as anything does. */
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  /** For a form of one field, which takes focus as it opens. */
  autoFocus?: boolean;
};

/** Each look's field, and the sign at its end, so the hue is never alone (DESIGN.md, *Forms*). */
const LOOKS = {
  fault: {
    field: 'border-2 border-fault bg-fault/10 pr-11',
    sign: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  },
  valid: {
    field: 'border-2 border-valid bg-valid/10 pr-11',
    sign: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  },
  rest: { field: 'border border-edge bg-surface-lift', sign: undefined },
} as const;

/**
 * A form's field under its label and its fault: the one place a form is joined to our `Input` (ADR
 * 0009). The form's `ref` goes with the rest, so a refused form focuses its first fault, which brings
 * it into view. What is kept in view is the field, so its fault is above it and not under. A field at
 * fault is red with a warning sign, and one left right green with a tick.
 */
export function FormField<Typed extends FieldValues, Said>({
  control,
  name,
  label,
  placeholder,
  keyboardType,
  autoFocus,
}: FormFieldProps<Typed, Said>) {
  const tint = useTint();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, ...field }, fieldState }) => {
        const { error } = fieldState;
        const look = fieldLook(fieldState);
        const { sign } = LOOKS[look];
        return (
          <View className="gap-1">
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              className="font-language text-label text-ink-mid"
            >
              {label}
            </Text>
            {error ? (
              <Text className="font-language-bold text-label text-fault">{error.message}</Text>
            ) : null}
            <View className="justify-center">
              <Input
                {...field}
                accessibilityLabel={label}
                accessibilityHint={error?.message}
                placeholder={placeholder}
                keyboardType={keyboardType}
                autoFocus={autoFocus}
                onChangeText={onChange}
                className={`font-language text-body ${LOOKS[look].field}`}
              />
              {sign ? (
                <View pointerEvents="none" className="absolute right-3">
                  <SymbolView
                    name={sign}
                    size={20}
                    tintColor={look === 'fault' ? tint.fault : tint.valid}
                  />
                </View>
              ) : null}
            </View>
          </View>
        );
      }}
    />
  );
}
