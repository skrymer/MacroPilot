import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

/** The system's own tab bar on each platform, so each takes its own symbol. */
export default function TabsLayout() {
  // Android's bar takes its colours when the tabs render, so a light/dark change has to render them
  // again, and the React Compiler would hand back the render it kept. The hook asks for that render;
  // the router does too, until its `adaptiveColors` is turned off.
  'use no memo';
  useColorScheme();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="log">
        <NativeTabs.Trigger.Label>Log</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus.circle" md="add_circle" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="foods">
        <NativeTabs.Trigger.Label>Foods</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
      </NativeTabs.Trigger>
      {/* Last, and only in a development build; the page itself also refuses a release build. */}
      <NativeTabs.Trigger name="developer" hidden={!__DEV__}>
        <NativeTabs.Trigger.Label>Developer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="hammer" md="construction" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
