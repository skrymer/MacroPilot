import { ActionSheetIOS, Alert, Platform } from 'react-native';

import type { Ask, Question } from './Ask';

/** The system's question: an action sheet on iOS, a dialog on Android. */
export class SystemAsk implements Ask {
  ask(question: Question): Promise<boolean> {
    return Platform.OS === 'ios' ? askBySheet(question) : askByDialog(question);
  }
}

const askBySheet = ({ title, message, loses }: Question) =>
  new Promise<boolean>((resolve) => {
    const options = [loses, 'Cancel'];
    ActionSheetIOS.showActionSheetWithOptions(
      { title, message, options, destructiveButtonIndex: 0, cancelButtonIndex: 1 },
      (pressed) => resolve(pressed === 0),
    );
  });

const askByDialog = ({ title, message, loses }: Question) =>
  new Promise<boolean>((resolve) => {
    const cancel = () => resolve(false);
    const buttons = [
      { text: 'Cancel', style: 'cancel', onPress: cancel },
      { text: loses, style: 'destructive', onPress: () => resolve(true) },
    ] as const;
    Alert.alert(title, message, [...buttons], { cancelable: true, onDismiss: cancel });
  });
