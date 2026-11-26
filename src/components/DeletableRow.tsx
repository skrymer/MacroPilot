import type { ComponentRef, ReactNode, Ref } from 'react';
import { View } from 'react-native';

import { DeleteButton } from './DeleteButton';
import { Text } from './Text';

/** A row with its *Delete*, and over it why it is still there: under the lowest row is out of view. */
export function DeletableRow({
  ref,
  name,
  onDelete,
  fault,
  children,
}: {
  ref?: Ref<ComponentRef<typeof View>>;
  /** What a screen reader hears is deleted. */
  name: string;
  onDelete: () => void;
  fault?: string;
  children: ReactNode;
}) {
  return (
    <View ref={ref} className="flex-row flex-wrap items-center justify-between gap-x-grid-2">
      <View className="min-w-name flex-1">
        {fault ? (
          <Text accessibilityRole="alert" className="font-language-bold text-body text-ink">
            {fault}
          </Text>
        ) : null}
        {children}
      </View>
      <DeleteButton name={name} onPress={onDelete} />
    </View>
  );
}
