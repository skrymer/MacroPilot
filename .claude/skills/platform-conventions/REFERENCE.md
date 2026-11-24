# The rules nothing automates

| Rule | API | Check |
| --- | --- | --- |
| No content under the Dynamic Island, notch, status bar or home indicator; the ground runs edge to edge | `react-native-safe-area-context`, never React Native's `SafeAreaView` | `/verify` on both platforms |
| The keyboard never hides the field being typed in or the action that commits it, and one tap commits | A scroll view with `keyboardShouldPersistTaps="handled"`; the platform's keyboard avoidance | `/verify` on the iPhone and the emulator |
| A screen shown before a system permission prompt may explain, never imitate it: its button reads "Continue", not "Allow" ([App Review 5.1.1](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)). A refusal is a state on the screen with a route to Settings, never an `Alert` | `Linking.openSettings()` | A screen test per grant state; `/verify` from a fresh install |
| Haptics confirm a deliberate act, never a figure updating | `expo-haptics` | `/verify` on the iPhone |
| The status bar follows the appearance | `<StatusBar style="auto" />`, once, in `app/_layout.tsx` | `/verify` in both appearances |
| A figure is announced with its unit as a word ("132 grams of protein"), an absence as its words; figure and unit are one element | `accessibilityLabel`, `accessible` on the container | A screen test by label, and a sibling for the absence |
