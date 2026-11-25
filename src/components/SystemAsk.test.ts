import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { SystemAsk } from './SystemAsk';

const QUESTION = { title: 'Delete this food?', message: 'Milk goes.', loses: 'Delete' } as const;

describe('SystemAsk', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['Delete', true],
    ['Cancel', false],
  ])('asks by an action sheet on iOS, and answered %s gives %s', async (answer, goesOn) => {
    // Given an iPhone, whose user will press that answer, and only what it loses in red
    jest.replaceProperty(Platform, 'OS', 'ios');
    jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation(({ title, message, options, ...rest }, press) => {
        const red = options[rest.destructiveButtonIndex as number];
        const cancels = options[rest.cancelButtonIndex as number];
        if (title === QUESTION.title && message === QUESTION.message) {
          if (red === 'Delete' && cancels === 'Cancel') press(options.indexOf(answer));
        }
      });

    // When it is asked
    const answered = await new SystemAsk().ask(QUESTION);

    // Then that is the answer
    expect(answered).toBe(goesOn);
  });

  it.each([
    ['Delete', true],
    ['Cancel', false],
    ['nothing, and Back', false],
  ])('asks by a dialog on Android, and answered %s gives %s', async (answer, goesOn) => {
    // Given an Android phone, whose user will press that answer, or put the dialog away by Back
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons = [], options = {}) => {
      if (title !== QUESTION.title || message !== QUESTION.message) return;
      const pressed = buttons.find(({ text }) => text === answer);
      if (pressed) pressed.onPress?.();
      else if (options.cancelable) options.onDismiss?.();
    });

    // When it is asked
    const answered = await new SystemAsk().ask(QUESTION);

    // Then that is the answer
    expect(answered).toBe(goesOn);
  });
});
