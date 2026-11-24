// NativeWind's cssInterop gives react-native-svg's shapes a className, so a token reaches a stroke
// through a class. The import makes this an augmentation of the package's types rather than a
// replacement for them.
import 'react-native-svg';

declare module 'react-native-svg' {
  interface CircleProps {
    className?: string;
  }
}
