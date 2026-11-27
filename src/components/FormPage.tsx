import { useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { Dimensions, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './Button';
import { Failure } from './Failure';
import { FormHeader } from './FormHeader';

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
  // Where the page starts on the screen, below Android's bar or in iOS's sheet. The keyboard is
  // measured on the screen and the page from its parent, so without it the button stays under the
  // keyboard by the distance between them. It is the screen less the page, which reaches the bottom
  // of the screen on both platforms: `measureInWindow` does not see where iOS's sheet stands, and
  // left the button under the keyboard there (the user's word, 27 November 2026, recorded on #87).
  const [top, setTop] = useState(0);
  return (
    // The header keeps the top inset.
    <SafeAreaView
      onLayout={(e) => setTop(Dimensions.get('screen').height - e.nativeEvent.layout.height)}
      edges={['bottom', 'left', 'right']}
      className="flex-1 bg-ground"
    >
      <FormHeader title={title} onCancel={onCancel} />
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={top} className="flex-1">
        <ScrollView
          ref={scroll}
          // iOS's bar is glass over the sheet: what scrolls starts under it unless inset for it, which
          // hid the first field (the user's word, 27 November 2026, recorded on #87).
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          // What scrolls is the one card the fields stand in, so a field's `onLayout` is still measured
          // from the top of what scrolls.
          contentContainerClassName="m-page gap-grid-2 rounded-card bg-surface p-grid-2"
        >
          {children}
        </ScrollView>
        {/* Out of the scroll view, so that the keyboard never hides them. */}
        <View className="gap-grid-1 px-page py-grid-1">
          {fault ? <Failure words={fault} /> : null}
          <Button label={action} onPress={onAction} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
