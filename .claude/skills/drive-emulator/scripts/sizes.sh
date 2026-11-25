#!/usr/bin/env bash
# Photographs screens at the sizes ADR 0007 fixes, top to bottom, to be looked at.
#
#   sizes.sh <out-dir> <route>…      sizes.sh shots / design
#
#   default      text 1.0, the device's own display size
#   text         text 2.0
#
# SIZES=text photographs one, while a screen or this script is being worked on. /verify owes
# SIZES=default on an issue, and both on an epic. A narrower screen is never checked.
#
# Run emulator.sh first; METRO_PORT as there. Each size loads the bundle again, since Android recreates
# the activity when the text size changes. Every setting is put back on exit, however it ends. Exits 1
# when a screen could not be photographed whole.
set -euo pipefail

out=${1:?usage: sizes.sh <out-dir> <route>…}
shift
[ $# -gt 0 ] || { echo "usage: sizes.sh <out-dir> <route>…" >&2; exit 2; }
all="default text"
sizes=${SIZES:-$all}
for size in $sizes; do
  [[ " $all " == *" $size "* ]] || { echo "sizes.sh: no size $size; they are $all" >&2; exit 2; }
done
mkdir -p "$out"
out=$(cd "$out" && pwd)
cd "$(dirname "$0")/../../../.."

export ANDROID_HOME=${ANDROID_HOME:-$HOME/Android/Sdk}
export PATH="$ANDROID_HOME/platform-tools:$PATH"
app=com.skrymer.macropilot
load="macropilot://expo-development-client/?url=http%3A%2F%2Flocalhost%3A${METRO_PORT:-8081}"

# In this checkout's own session, with the tool's chatter kept for when it fails.
log=$(mktemp -t sizes-XXXX.log)
ad() { npx agent-device "$@" --platform android >>"$log" 2>&1; }

restore() {
  adb shell settings put system font_scale 1.0
  adb shell wm density reset
  adb shell cmd uimode night no
  ad close
} >/dev/null 2>&1
trap restore EXIT

failed=0
miss() {
  echo "sizes.sh: $1 (see $log)" >&2
  failed=1
}

# One screen, a photo a page, until a scroll shows nothing new. The status bar is normalised, so its
# clock cannot make two looks at one page differ.
shoot() {
  local size=$1 route=$2 slug page file last=
  slug=$(echo "$route" | sed 's#^/*##; s#[^A-Za-z0-9]#-#g')
  slug=${slug:-root}
  ad open "macropilot://${route#/}" || { miss "$route did not open at $size"; return 0; }
  ad wait stable 800 8000 || true
  for page in $(seq 20); do
    file="$out/$slug-$size-$page.png"
    ad screenshot "$file" --normalize-status-bar || { miss "no photo of $route at $size"; return 0; }
    if [ -n "$last" ] && cmp -s "$file" "$last"; then
      rm "$file"
      return 0
    fi
    last=$file
    ad scroll down 0.7 --settle || true
  done
  miss "$route at $size is longer than 20 pages"
}

for size in $sizes; do
  scale=1.0
  [ "$size" = text ] && scale=2.0
  adb shell settings put system font_scale "$scale"
  adb shell wm density reset
  adb shell cmd uimode night no >/dev/null
  adb shell am force-stop "$app"
  ad open "$app" "$load" && ad wait text "Today" 30000 || { miss "the bundle did not load at $size"; continue; }
  for route in "$@"; do shoot "$size" "$route"; done
done

ls "$out"/*.png 2>/dev/null || true
[ "$sizes" = "$all" ] || echo "sizes.sh: only $sizes; not the whole check"
exit "$failed"
