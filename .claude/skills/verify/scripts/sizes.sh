#!/usr/bin/env bash
# Photographs screens at the sizes ADR 0007 fixes, top to bottom, for a person or an agent to look at.
#
#   sizes.sh <out-dir> <route>…      sizes.sh shots / design
#
#   default      text 1.0, the device's own display size
#   text         text 2.0
#   display      text 1.0, 320dp wide
#   worst        text 2.0, 320dp wide
#   worst-dark   the same, in the dark appearance
#
# Not yet proven on the emulator, and not yet part of the verify skill.
#
# Run emulator.sh first, with the bundle loaded. METRO_PORT as there. Each size reopens the bundle,
# since Android recreates the activity when the text size changes. Every setting is put back on exit,
# however it ends. Exits 1 when a screen could not be opened.
set -euo pipefail

out=${1:?usage: sizes.sh <out-dir> <route>…}
shift
[ $# -gt 0 ] || { echo "usage: sizes.sh <out-dir> <route>…" >&2; exit 2; }
mkdir -p "$out"

export PATH="${ANDROID_HOME:-$HOME/Android/Sdk}/platform-tools:$PATH"
app=com.skrymer.macropilot
port=${METRO_PORT:-8081}
driving="$(cd "$(dirname "$0")/../../break-it/references" && pwd)/driving.md"
ad=$(sed -n 's/^ad="\(npx [^"]*\)".*/\1/p' "$driving") # the version is pinned there
[ -n "$ad" ] || { echo "sizes.sh: no pinned agent-device in $driving" >&2; exit 2; }

restore() {
  adb shell settings put system font_scale 1.0
  adb shell wm density reset
  adb shell cmd uimode night no
} >/dev/null 2>&1
trap restore EXIT

pixels=$(adb shell wm size | sed -n 's/.*: \([0-9]*\)x.*/\1/p' | tail -1)
narrow=$((pixels * 160 / 320))

view() { adb shell am start -W -a android.intent.action.VIEW -d "'$1'" "$app" >/dev/null 2>&1; }

failed=0
shoot() {
  local name=$1 route=$2 slug page before after
  slug=$(echo "$route" | sed 's#^/*##; s#[^A-Za-z0-9]#-#g')
  slug=${slug:-root}
  view "macropilot://${route#/}"
  sleep 4
  adb shell dumpsys window | grep -q "mCurrentFocus.*$app" || {
    echo "sizes.sh: $route is not in front at $name" >&2
    failed=1
    return 0
  }
  $ad open "$app" --platform android --foreground >/dev/null 2>&1 || true
  before=
  for page in 1 2 3 4 5 6 7 8 9 10 11 12; do
    local file="$out/$slug-$name-$page.png"
    adb exec-out screencap -p >"$file"
    # Below the status bar, where the clock would make two looks at one page differ.
    after=$($ad snapshot --json 2>/dev/null | sed 's/"generation[^,]*,//g; s/~s[0-9]*//g' | md5sum)
    if [ "$after" = "$before" ]; then
      rm "$file"
      break
    fi
    before=$after
    $ad scroll down >/dev/null 2>&1 || break
    sleep 1
  done
}

for size in default text display worst worst-dark; do
  scale=1.0 density=reset night=no
  case $size in
    text) scale=2.0 ;;
    display) density=$narrow ;;
    worst) scale=2.0 density=$narrow ;;
    worst-dark) scale=2.0 density=$narrow night=yes ;;
  esac
  adb shell settings put system font_scale "$scale"
  adb shell wm density "$density"
  adb shell cmd uimode night "$night" >/dev/null
  adb shell am force-stop "$app"
  view "macropilot://expo-development-client/?url=http%3A%2F%2Flocalhost%3A$port"
  sleep 10
  for route in "$@"; do shoot "$size" "$route"; done
done
$ad close >/dev/null 2>&1 || true

ls "$out"/*.png
exit "$failed"
