import { Pressable, View } from 'react-native';

import { FieldFrame } from './FieldFrame';
import { Text } from './Text';
import { useRipple } from './useRipple';

/**
 * One answer of two or more, chosen side by side: a segmented choice outlined in ink, the chosen one
 * filled, heard as a radio group. None is chosen until the user chooses.
 */
export function Segments<Value extends string | boolean>({
  label,
  options,
  value,
  onChange,
  fault,
}: {
  label: string;
  options: readonly { label: string; value: Value }[];
  value: Value | undefined;
  onChange: (value: Value) => void;
  /** Why what is chosen will not do, said under the label. */
  fault?: string;
}) {
  const ripple = useRipple('page');
  return (
    <FieldFrame label={label} fault={fault}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        accessibilityHint={fault}
        className={`flex-row overflow-hidden rounded-2xl ${fault ? 'border-2 border-fault' : 'border border-ink'}`}
      >
        {options.map((option) => {
          const chosen = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: chosen }}
              onPress={() => onChange(option.value)}
              android_ripple={ripple}
              className={`min-h-target min-w-target flex-1 items-center justify-center px-2 ios:active:opacity-60 ${chosen ? 'bg-ink' : ''}`}
            >
              <Text
                className={`text-center font-language-bold text-label ${chosen ? 'text-ground' : 'text-ink'}`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FieldFrame>
  );
}
