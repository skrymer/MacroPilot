const { AndroidConfig, withAndroidStyles } = require('expo/config-plugins');

const DIALOG = 'SentenceCaseAlertDialog';
const BUTTON = 'SentenceCaseAlertButton';

/**
 * Android's questions (*Delete*, *Discard*, *Cancel*) in sentence case, as Material 3 has them
 * (DESIGN.md, *Asking and telling*). React Native's `Alert` is AppCompat's dialog, whose buttons
 * inherit `textAllCaps` from the Material 2 theme and draw CANCEL and DELETE. The app theme's
 * `alertDialogTheme` points at an overlay whose three buttons do not.
 */
module.exports = function withSentenceCaseDialogs(config) {
  return withAndroidStyles(config, (config) => {
    const { Styles } = AndroidConfig;
    let xml = config.modResults;
    const button = { name: BUTTON, parent: 'Widget.AppCompat.Button.ButtonBar.AlertDialog' };
    const dialog = { name: DIALOG, parent: 'ThemeOverlay.AppCompat.Dialog.Alert' };
    for (const name of ['android:textAllCaps', 'textAllCaps']) {
      xml = Styles.assignStylesValue(xml, { add: true, parent: button, name, value: 'false' });
    }
    for (const name of [
      'buttonBarPositiveButtonStyle',
      'buttonBarNegativeButtonStyle',
      'buttonBarNeutralButtonStyle',
    ]) {
      xml = Styles.assignStylesValue(xml, {
        add: true,
        parent: dialog,
        name,
        value: `@style/${BUTTON}`,
      });
    }
    xml = Styles.assignStylesValue(xml, {
      add: true,
      parent: Styles.getAppThemeGroup(),
      name: 'alertDialogTheme',
      value: `@style/${DIALOG}`,
    });
    config.modResults = xml;
    return config;
  });
};
