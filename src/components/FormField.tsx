import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { View, type KeyboardTypeOptions } from 'react-native';

import { Input } from './Input';
import { Text } from './Text';

type FormFieldProps<Typed extends FieldValues, Said> = {
  control: Control<Typed, unknown, Said>;
  name: Path<Typed>;
  label: string;
  keyboardType?: KeyboardTypeOptions;
};

/**
 * A form's field under its label, with its fault beside it: the one place a form is joined to our
 * `Input` (ADR 0009). The form's `ref` goes with the rest, so a refused form focuses its first fault,
 * which brings it into view.
 */
export function FormField<Typed extends FieldValues, Said>({
  control,
  name,
  label,
  keyboardType,
}: FormFieldProps<Typed, Said>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, ...field }, fieldState: { error } }) => (
        <View className="gap-1">
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="font-language text-label text-ink-mid"
          >
            {label}
          </Text>
          <Input
            {...field}
            accessibilityLabel={label}
            accessibilityHint={error?.message}
            keyboardType={keyboardType}
            onChangeText={onChange}
            className="font-language text-body"
          />
          {error ? (
            <Text className="font-language-bold text-label text-ink">{error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}
