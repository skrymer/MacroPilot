---
name: drive-emulator
description: Drives this app on the Android emulator. Boots it and loads this checkout's bundle into the development build, then gives the moves the app's checks need (text size, appearance, time zone, clock, kill, network), photographs screens at fixed sizes, and puts everything back. Use before driving the app with agent-device, for verify and break-it, when a screen has to be looked at on Android, or when the user says "run it on the emulator".
---

# Drive the emulator

**The `agent-device` skill is how to drive; this is what it cannot know about this app.** The tool is a dev dependency, so `npx agent-device` in the repo is always the pinned version, and that skill is copied unchanged from the same version's tag: bump both together. For a command's shape, `npx agent-device help <command>`. The docs online name no version, so the help decides.

Commands below have been run against this app, except those marked *unproven*.

## Start

```bash
export METRO_PORT=8082                                  # when another checkout holds 8081
.claude/skills/drive-emulator/scripts/emulator.sh || exit 1   # boots it headless, prints the serial; a pipe hides its refusal
alias ad="npx agent-device"
ad open com.skrymer.macropilot "macropilot://expo-development-client/?url=http%3A%2F%2Flocalhost%3A$METRO_PORT" --platform android
ad wait text "Today" 30000
```

- Metro first, with the `debug` skill. `emulator.sh` refuses another checkout's, boots nothing beside another checkout's mutation run, and says what else is missing. The machine is shared: look before a Gradle build too.
- **`--metro-port` does not load this app**: it stops at the dev client's launcher. The link above does.
- From a fresh install (`ad settings clear-app-state com.skrymer.macropilot`) the dev menu's introduction is in front: `press 'label="Continue"' --settle`, then `adb shell input keyevent BACK`.
- A screen: `ad open macropilot://<route> --platform android`, with the bundle loaded. **A cold link** is force-stop, then the link, then a tap on the launcher's row for the server, which delivers it. Loading the bundle by its own link drops the waiting one, and then passes any check that expects Today. Run the control too: the same gesture on the development bundle has to show the page.
- One agent drives one emulator. Finish with `ad close`, without `--shutdown`: `emulator.sh` booted it, not the session. **`ad close`, and so `sizes.sh`'s exit, leaves the app on the dev client's launcher**: load the bundle again by its link before driving.

## Drive it the tool's way

The rules are the `agent-device` skill's. They are here because the first testers had them and broke them.

- **Act with `--settle` and read the diff it prints.** `snapshot` again only when the diff lacks the next target.
- **Wait for a thing, never `sleep`**: `wait text "…"`, `wait absent <selector>`.
- **No pipes**: `| tail` and `| grep` drop the refs and the hints the next step needs. Chain sure steps with `&&`, or `ad batch`. **A scripted walk joins with `&&`, never `;`**, so it stops at its first failed `wait` instead of timing out on every step after it.
- **Raw `adb` only for a move in the table below**, or for a race the tool cannot produce, such as links 60 ms apart.

## Check

- A named expectation: `is exists|absent|visible|text <selector>` exits non-zero when it fails; `wait text`, `get`. **`find` clicks.** Wait for a thing, never for a time.
- **The evidence is the snapshot**: `ad snapshot --force-full > <file>`. Without the flag an unchanged screen prints an acknowledgement, not a tree; `-i` is for finding the next target and drops static text, so it never showed Today's header. A `--scope` that matches nothing is an empty tree, not an absence: for that, `is absent`. `charters.mjs` refuses an empty file.
- **A tab shares its label with its page**: `label="Today"` matches three elements. The selected tab is `'role=group label="Today" selected=true'`.
- A tree that looks stale: one screenshot and one fresh snapshot, never a loop.
- **Look at the pixels where they decide**: colour, appearance, clipping, size, a figure. `ad screenshot <file> --normalize-status-bar`, `--crop-on 'text="0 kcal"'` for one element. The tree has read "0 kcal" while the screen showed "0".
- **A colour is measured with `.claude/skills/drive-emulator/scripts/pixels.mjs bar=60,2320 ground=540,1200`**, which refuses while a warning overlay is in front. The points are in pixels, on this AVD.
- **A gap or a height is measured with `.claude/skills/drive-emulator/scripts/spacing.mjs ..Today=page 'Today..*today=grid-2' 'Oats=two-line'`**: each against its token, in dp, as `PASS` or `FAULT … required 16dp (page)`. `..B` is a margin from the left edge, `A..B` a gap, a bare `A` a height held as a floor; an element is the first label starting with the text (`*` for ending). It finds the outermost labelled element, so a card's label measures the card, not its contents. `--tokens` prints the table.
- `ad audit` on a screen the change touched: targets under 48dp, controls with no name, covered controls. It reads what is in front, so clear a warning overlay first.
- An `ERROR` in Metro's log since the last probe fails it. So does a red badge at the bottom left.
- The round gear is the dev client's, not the app's.

## Moves

| Move | Run |
| --- | --- |
| Text size | `adb shell settings put system font_scale 2.0`. Android's ladder ends there, and the tool's `text-size` goes to 3.2 |
| Appearance | `ad settings appearance dark`, `light` |
| Kill, and process death | `adb shell am force-stop com.skrymer.macropilot`; `adb shell am kill …` from the background |
| Home and back | `adb shell input keyevent HOME`, `adb shell am start -n com.skrymer.macropilot/.MainActivity` |
| Double press | `ad press <target> --count 2 --interval-ms 60` |
| Network | `ad settings airplane on`, `off`. Metro comes over adb, so it is not cut |
| Time zone | `adb shell settings put global auto_time_zone 0`, `adb shell cmd alarm set-timezone Pacific/Auckland` |
| Clock | `adb root`, `adb shell settings put global auto_time 0`, `adb shell date 112423592026.00` (MMDDhhmmYYYY.ss, local), `adb shell am broadcast -a android.intent.action.TIME_SET`. `adb root` and `adb unroot` each drop the port: run `emulator.sh` again, or the app opens on the launcher |
| A flow's clock | `TZ=<zone> npx agent-device test …`. A flow's `${…}` JavaScript runs in agent-device's daemon, which takes the caller's zone; the phone's clock is not moved. Choose the zone whose local time is just before the moment wanted, `:30` and `:45` zones included, rather than wait for it: #94 waited 23 and 38 minutes for a midnight. Stop this checkout's daemon first if it was started in another zone. POSIX minute offsets (`TZ='X-12:34'`) are *unproven* |
| The real keyboard | `adb shell ime set com.google.android.inputmethod.latin/com.android.inputmethod.latin.LatinIME` after the last `ad press`, `ad fill` or `ad open`, each of which puts the headless one back, and press with `adb shell input tap` from there; then `adb shell dumpsys input_method` says `mCurId=…LatinIME`. `--no-test-ime` left the headless one on, with `mInputShown=true`. Back: `adb shell ime set com.callstack.agentdevice.imehelper/.TestInputMethodService` |
| Animations (*unproven*) | `ad settings animations off` for a walk-through, `on` for a charter about motion |
| Typing | `ad fill 'role=text-field label="Grams"' "180" --settle`. `label=` alone matches the visible label too, and types nothing |
| Permission (*unproven*) | `ad settings permission deny camera --app com.skrymer.macropilot`; a dialog already up is `ad alert` |
| What shows for under a second (a flash on a link, a page passed through) | `adb shell 'screenrecord --bugreport --output-format=raw-frames --size 270x600 /sdcard/f.raw' &`, the action, then `adb shell pkill -2 screenrecord`; each frame carries its time. `--time-limit` does not stop raw frames, and `screenshot` takes about 3 s a frame. Delete the file after (#122's 310 ms was measured so) |
| A flow's red (ADR 0011) | `METRO_PORT=<Metro's> node .claude/skills/drive-emulator/scripts/mutant-proxy.mjs '<source>' '<mutant>' &`, `adb reverse tcp:8083 tcp:8083`, then `npx agent-device test <flow> --maestro --platform android -e METRO_PORT=8083`. The proxy serves Metro's bundle with the one string replaced; its log must say it was replaced once, or the red proves nothing. A mutant that leaves the flow green is a gap in the flow, not in the mutant |
| A release bundle | Proxy Metro's manifest with `dev=true` rewritten to `dev=false&minify=true`, and load the proxy's port. Still the dev client's red box |

## Sizes

```bash
.claude/skills/drive-emulator/scripts/sizes.sh <out-dir> / design
```

Photographs each route, top to bottom, at the two sizes ADR 0007 fixes. **It sets the appearance itself**, light unless `APPEARANCE=dark` is given, so `ad settings appearance dark` beforehand is undone and the photos come out light. While a screen or the script is being worked on, name one. An issue owes `SIZES=default`, and an epic both. **The sizes hold a form's scale, and not its content**: one that takes a name or shows a fault is photographed with a name of 64 characters, each fault showing and the real keyboard up, and *holds* is said of what was photographed alone. **Look at every photo**: a unit lost, a word broken, text clipped or touching, a control out of reach.

## Traps

- **`ad close` sends the app to the launcher**: measure and photograph before it.
- **The manifest comes from the installed build**, not from Metro. A change to `app.json` or a plugin needs a prebuild, a Gradle build and a reinstall, and so does going back.
- **A development load shows an `ImageBackground` warning toast over the tab bar.** It has stayed over 12 s, and catches a press on a tab, which opens the LogBox. Open pages by link instead (`ad open macropilot://developer --platform android`). If the LogBox opens: `ad press 'role=group label="Dismiss"' --settle`; `label="Dismiss"` alone is ambiguous.
- **Selectors match exactly.** There is no `text*=`, which is refused as invalid.
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
adb shell input keyevent KEYCODE_WAKEUP; adb shell wm dismiss-keyguard
```
