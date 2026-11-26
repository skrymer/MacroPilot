// The system's header, as a screen reader hears it: a heading named the page's title (ADR 0001's
// boundary list). The platform draws it outside React, from props, so without this no screen test
// could find a page by its title.
jest.mock('react-native-screens/lib/commonjs/fabric/ScreenStackHeaderConfigNativeComponent', () => {
  const { createElement } = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ title, hidden }: { title?: string; hidden?: boolean }) =>
      hidden || !title ? null : createElement(Text, { accessibilityRole: 'header' }, title),
  };
});
