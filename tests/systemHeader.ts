import type { ReactNode } from 'react';

type BarButton = { type: string; title?: string; buttonId?: string };

// The system's header, as a screen reader hears it (ADR 0001's boundary list): iOS's bar buttons at
// its left, each a button named by its label, such as a form's X heard as Cancel; what React draws
// in it, such as that X on Android; then a heading named the page's title. The platform draws the
// bar's buttons and title outside React, from props, so without this no screen test could find
// them.
jest.mock('react-native-screens/lib/commonjs/fabric/ScreenStackHeaderConfigNativeComponent', () => {
  const { createElement, Fragment } = jest.requireActual('react');
  const { Pressable, Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      title,
      hidden,
      children,
      headerLeftBarButtonItems = [],
      onPressHeaderBarButtonItem,
    }: {
      title?: string;
      hidden?: boolean;
      children?: ReactNode;
      headerLeftBarButtonItems?: BarButton[];
      onPressHeaderBarButtonItem?: (event: { nativeEvent: { buttonId?: string } }) => void;
    }) =>
      hidden
        ? null
        : createElement(
            Fragment,
            null,
            ...headerLeftBarButtonItems
              .filter((item) => item.type === 'button')
              .map((item) =>
                createElement(Pressable, {
                  key: item.buttonId,
                  accessibilityRole: 'button',
                  accessibilityLabel: item.title,
                  onPress: () => onPressHeaderBarButtonItem?.({ nativeEvent: item }),
                }),
              ),
            children,
            title ? createElement(Text, { accessibilityRole: 'header' }, title) : null,
          ),
  };
});
