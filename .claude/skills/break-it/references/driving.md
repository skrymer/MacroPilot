# Driving the emulator

How the walk-through drives a criterion, and how the break-it tester drives a charter. Every command here has been run against this app, except those marked *unproven*, taken from the tool's own help: the first agent to run one removes the mark or corrects it. Anything else: `agent-device help <command>` first, never from memory.

```bash
export ANDROID_HOME=~/Android/Sdk
ad="npx --yes agent-device@0.21.36"      # pinned here, and only here
```

`emulator.sh` first: it prints the serial. With Metro on another port, `METRO_PORT=8082` for it and for `metro.sh`. One agent drives one emulator at a time.

## Open

| To | Run |
| --- | --- |
| Load this checkout's bundle in the dev client | `adb shell am start -W -a android.intent.action.VIEW -d "'macropilot://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081'" com.skrymer.macropilot` (its port) |
| Start a session | `$ad open com.skrymer.macropilot --platform android --serial <serial> --foreground` |
| A screen by deep link | `$ad open macropilot://<route> --platform android`, with the bundle already loaded: from a killed app it lands in the dev client's launcher |
| From a fresh install | `$ad settings clear-app-state com.skrymer.macropilot`, then load the bundle again. The dev menu's intro comes back: `press 'label="Continue"'`, then `'label="Close"'` |
| Finish | `$ad close` |

## Act and look

- `$ad press 'label="Log"' --settle`, `$ad fill 'label="Grams"' "180" --settle` (*unproven*), `$ad type "1,5"` for real keystrokes (*unproven*: no field exists yet). By label, never coordinates.
- `$ad scroll down --until 'text="Black coffee"'`, `$ad scroll top`, `$ad back --settle`.
- **Check with `$ad is exists 'text="…"'` or `$ad wait text "…" 5000`. `find` is not a check: it taps what it finds.**
- `snapshot -i` lists only interactive elements, so an empty one is not an empty screen: use `snapshot`.
- `$ad screenshot <file>`, and `--crop-on 'text="0 kcal"'` for one element. **Then look at it.** The accessibility tree reads "0 kcal" whether or not the pixels do: a unit has been lost on screen while every query found it.
- Refs go stale after every action. Use selectors.
- The grey gear is the dev client's, not the app's.

## Moves

| Move | Run |
| --- | --- |
| Kill | `adb shell am force-stop com.skrymer.macropilot` |
| Home, and back to the app | `adb shell input keyevent HOME`, then `adb shell am start -n com.skrymer.macropilot/.MainActivity` |
| Double press | `$ad press 'label="Log"' --count 2 --interval-ms 60` |
| Appearance | `$ad settings appearance dark`, `light` |
| Text size | `adb shell settings put system font_scale 2.0` (Android's own ladder ends there; agent-device's goes to 3.2). It recreates the activity and leaves the red badge, so force-stop and load the bundle again |
| Display size | `adb shell wm density 540` (320dp wide on this AVD), `adb shell wm density reset` |
| A release bundle | Proxy Metro's manifest with `dev=true` rewritten to `dev=false&minify=true`, and load the proxy's port in the dev client. Not a release build: the red box is still the dev client's |
| Network | `$ad settings airplane on`, `off` |
| Time zone | `adb shell settings put global auto_time_zone 0`, then `adb shell cmd alarm set-timezone Pacific/Auckland` |
| Clock | `adb root`, `adb shell settings put global auto_time 0`, then `adb shell date 112423592026.00` (MMDDhhmmYYYY.ss, local) and `adb shell am broadcast -a android.intent.action.TIME_SET`. `adb root` drops the port: run `emulator.sh` again |
| Permission (*unproven*: none is asked for yet) | `$ad settings permission deny camera --app com.skrymer.macropilot` (denying a held one kills the app) |

Not proven here: rotation (the app is portrait), a slow network, an incoming call.

## Put it back

```bash
adb shell settings put system font_scale 1.0; adb shell wm density reset; $ad settings appearance light; $ad settings airplane off
adb shell settings put global auto_time 1; adb shell settings put global auto_time_zone 1
adb shell cmd alarm set-timezone Australia/Brisbane
```

## Evidence

- A screenshot per result, in the directory `charters.mjs head` printed, named by its key.
- Metro's log, for an `ERROR` since the last probe: one makes the result a `fail` even when the screen looks right. A red badge at the bottom left is the same thing, and its white bar hides the tab bar: a press there opens the error log. `$ad react-native dismiss-overlay` does not see it; force-stop the app and load the bundle again.
- "configured linking in multiple places" and "multiple navigation containers" after a text-size change are the recreated activity in a development build, not the change under test.
