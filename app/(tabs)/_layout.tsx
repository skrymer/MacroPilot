import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

/** The system's own tab bar on each platform, so each takes its own symbol. */
export default function TabsLayout() {
  // Android's bar takes its colours when the tabs render, so a light/dark change has to render them
  // again, and the React Compiler would hand back the render it kept.
  'use no memo';
  useColorScheme();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      {/* Last, and only in a development build; the page itself also refuses a release build. */}
      <NativeTabs.Trigger name="developer" hidden={!__DEV__}>
        <NativeTabs.Trigger.Label>Developer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="hammer" md="construction" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
