import type { ComponentRef, ReactNode, Ref } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './Button';
import { CancelButton } from './CancelButton';
import { Text } from './Text';

/**
 * A form on a full-height page with *Cancel* (DESIGN.md, *Asking and telling*). Its fields are the
 * scroll view's own children, so a field's `onLayout` is measured from the top of what scrolls.
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
    <SafeAreaView className="flex-1 bg-ground">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-grid-2 px-page pb-grid-2"
        >
          <View className="items-start">
            <CancelButton onPress={onCancel} />
            <Text accessibilityRole="header" className="font-language-bold text-title text-ink">
              {title}
            </Text>
          </View>
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
