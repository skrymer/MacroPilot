import type { ComponentRef, ReactNode, Ref } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './Button';
import { FormHeader } from './FormHeader';
import { Text } from './Text';

/**
 * A form, presented the platform's way under the system's header with its X (DESIGN.md, *Forms*). Its
 * fields are the scroll view's own children, so a field's `onLayout` is measured from the top of what
 * scrolls.
 */
export function FormPage({
  title,
  onCancel,
  fault,
  action,
  onAction,
  scroll,
  children,
}: {
  title: string;
  onCancel: () => void;
  /** Why the form was not kept, said above the button. */
  fault?: string;
  action: string;
  onAction: () => void;
  scroll?: Ref<ComponentRef<typeof ScrollView>>;
  children: ReactNode;
}) {
  return (
    // The header keeps the top inset.
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-ground">
      <FormHeader title={title} onCancel={onCancel} />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-grid-2 px-page py-grid-2"
        >
          {children}
        </ScrollView>
        {/* Out of the scroll view, so that the keyboard never hides them. */}
        <View className="gap-grid-1 px-page py-grid-1">
          {fault ? (
            <Text accessibilityRole="alert" className="font-language-bold text-body text-ink">
              {fault}
            </Text>
          ) : null}
          <Button label={action} onPress={onAction} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
