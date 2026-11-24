import { NativeTabs } from 'expo-router/native-tabs';

/** The system's own tab bar on each platform, so each takes its own symbol. */
export default function TabsLayout() {
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
