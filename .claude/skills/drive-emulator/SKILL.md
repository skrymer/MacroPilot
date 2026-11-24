---
name: drive-emulator
description: Drives this app on the Android emulator. Boots it and loads this checkout's bundle into the development build, then gives the moves the app's checks need (text and display size, appearance, time zone, clock, kill, network), photographs screens at fixed sizes, and puts everything back. Use before driving the app with agent-device, for verify and break-it, when a screen has to be looked at on Android, or when the user says "run it on the emulator".
---

# Drive the emulator

**The `agent-device` skill is how to drive; this is what it cannot know about this app.** The tool is a dev dependency, so `npx agent-device` in the repo is always the pinned version, and that skill is copied unchanged from the same version's tag: bump both together. For a command's shape, `npx agent-device help <command>`. The docs online describe a newer one.

Commands below have been run against this app, except those marked *unproven*.

## Start

```bash
export METRO_PORT=8082                                  # when another checkout holds 8081
.claude/skills/drive-emulator/scripts/emulator.sh       # boots it headless, prints the serial
alias ad="npx agent-device"
ad open com.skrymer.macropilot "macropilot://expo-development-client/?url=http%3A%2F%2Flocalhost%3A$METRO_PORT" --platform android
ad wait text "Today" 30000
```

- Metro first, with the `debug` skill. `emulator.sh` refuses another checkout's, boots nothing beside another checkout's mutation run, and says what else is missing. The machine is shared: look before a Gradle build too.
- **`--metro-port` does not load this app**: it stops at the dev client's launcher. The link above does.
- From a fresh install (`ad settings clear-app-state com.skrymer.macropilot`) the dev menu's introduction is in front: `press 'label="Continue"' --settle`, then `'label="Close"'`.
- A screen: `ad open macropilot://<route> --platform android`, with the bundle loaded. From a killed app a link lands in the launcher.
- One agent drives one emulator. Finish with `ad close`, without `--shutdown`: `emulator.sh` booted it, not the session.

## Check

- A named expectation: `wait text`, `is`, `get`. **`find` clicks.** Wait for a thing, never for a time.
- **Then look at the pixels.** `ad screenshot <file> --normalize-status-bar`, `--crop-on 'text="0 kcal"'` for one element. The tree has read "0 kcal" while the screen showed "0".
- An `ERROR` in Metro's log since the last probe fails it. So does a red badge at the bottom left.
- The round gear is the dev client's, not the app's.

## Moves

| Move | Run |
| --- | --- |
| Text size | `adb shell settings put system font_scale 2.0`. Android's ladder ends there, and the tool's `text-size` goes to 3.2 |
| Display size | `adb shell wm density 540` (320dp wide on this AVD), `adb shell wm density reset` |
| Appearance | `ad settings appearance dark`, `light` |
| Kill, and process death | `adb shell am force-stop com.skrymer.macropilot`; `adb shell am kill …` from the background |
| Home and back | `adb shell input keyevent HOME`, `adb shell am start -n com.skrymer.macropilot/.MainActivity` |
| Double press | `ad press <target> --count 2 --interval-ms 60` |
| Network | `ad settings airplane on`, `off`. Metro comes over adb, so it is not cut |
| Time zone | `adb shell settings put global auto_time_zone 0`, `adb shell cmd alarm set-timezone Pacific/Auckland` |
| Clock | `adb root`, `adb shell settings put global auto_time 0`, `adb shell date 112423592026.00` (MMDDhhmmYYYY.ss, local), `adb shell am broadcast -a android.intent.action.TIME_SET`. `adb root` drops the port: run `emulator.sh` again |
| The real keyboard (*unproven*) | `--no-test-ime`. The tool types through a headless one, so nothing is ever covered by it otherwise |
| Animations (*unproven*) | `ad settings animations off` for a walk-through, `on` for a charter about motion |
| Typing (*unproven*) | `ad fill 'label="Grams"' "180" --settle`; `ad type "1,5"` for keystrokes |
| Permission (*unproven*) | `ad settings permission deny camera --app com.skrymer.macropilot`; a dialog already up is `ad alert` |
| A release bundle | Proxy Metro's manifest with `dev=true` rewritten to `dev=false&minify=true`, and load the proxy's port. Still the dev client's red box |

## Sizes

```bash
.claude/skills/drive-emulator/scripts/sizes.sh <out-dir> / design
```

Photographs each route, top to bottom, at the five sizes ADR 0007 fixes. About five minutes a long route, so run it in the background. While a screen or the script is being worked on, `SIZES=worst` first, and look before running the rest; never start a rerun in the same message as the fix. `/verify` owes all five. **Look at every photo**: a unit lost, a word broken, text clipped or touching, a control out of reach.

## Traps

- **A text-size change recreates the activity** and, in a development build, leaves two errors and a badge whose white bar hides the tab bar. `ad react-native dismiss-overlay` does not see it. Force-stop, and load the bundle again.
- `scroll` reports `movement: unobserved` here, so it cannot tell the end of a page.
- `adb shell uiautomator dump` fails while a session is open; `ad snapshot --raw --json` has the same data.
- **Never `pkill -f`**: it matches the shell running it, and other sessions. Kill by pid.

## Put it back

```bash
adb shell settings put system font_scale 1.0; adb shell wm density reset
ad settings appearance light; ad settings airplane off; ad close
adb shell settings put global auto_time 1; adb shell settings put global auto_time_zone 1
adb shell cmd alarm set-timezone Australia/Brisbane
```
