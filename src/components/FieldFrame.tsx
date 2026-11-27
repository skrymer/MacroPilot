import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './Text';

/**
 * A field's label above it in `ink-mid`, and its fault's words in `fault` under the label, above the
 * field, which is what a form keeps in view (DESIGN.md, *Forms*). The label is the field's own to say,
 * so a screen reader is not told it twice.
 */
export function FieldFrame({
  label,
  fault,
  children,
}: {
  label: string;
  fault?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-1">
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="font-language text-label text-ink-mid"
      >
        {label}
      </Text>
      {fault ? <Text className="font-language-bold text-label text-fault">{fault}</Text> : null}
      {children}
    </View>
  );
}
