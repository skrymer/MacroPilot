#!/usr/bin/env bash
# Makes the Android emulator ready to be driven, and prints its serial as the last line.
#
#   emulator.sh [avd]    boots the first AVD there is when none runs, or the one named
#
# Metro is looked for on METRO_PORT, 8081 when unset, and has to be this checkout's: another's would
# serve another app's code.
#
# Boots nothing beside another checkout's mutation run, or with too little memory.
#
# Stops, saying what is missing, rather than carry on: a probe on no app, or on a bundle from a
# Metro that is not there, reads as a finding about the code.
set -euo pipefail

sdk=${ANDROID_HOME:-$HOME/Android/Sdk}
export PATH="$sdk/platform-tools:$sdk/emulator:$PATH"
app=com.skrymer.macropilot
port=${METRO_PORT:-8081}
root=$(cd "$(dirname "$0")/../../../.." && pwd)
stop() { echo "emulator.sh: $1" >&2; exit 1; }

command -v adb >/dev/null || stop "no adb under $sdk; set ANDROID_HOME"

running() { adb devices | awk '/^emulator-[0-9]+\tdevice$/ { print $1; exit }'; }

serial=$(running)
if [ -z "$serial" ]; then
  # The machine is shared between sessions, and an emulator takes about 4 GB.
  for pid in $(pgrep -f 'stryker run' || true); do
    owner=$(readlink "/proc/$pid/cwd" || true)
    case $owner in
      '' | "$root" | "$root"/*) ;;
      *) stop "Stryker is running in $owner; ask before booting beside it" ;;
    esac
  done
  free=$(awk '/^MemAvailable/ { print int($2 / 1048576) }' "${MEMINFO:-/proc/meminfo}")
  [ "$free" -ge 6 ] || stop "$free GB of memory to spare; an emulator and Metro need 6"
  avd=${1:-$(emulator -list-avds | grep -v '^INFO' | head -1)}
  [ -n "$avd" ] || stop "no AVD exists; create one first"
  log=$(mktemp -t emulator-XXXX.log)
  echo "emulator.sh: booting $avd, logging to $log"
  setsid emulator -avd "$avd" -no-window -no-audio -no-boot-anim -no-snapshot-save >"$log" 2>&1 </dev/null &
  for _ in $(seq 60); do serial=$(running); [ -n "$serial" ] && break; sleep 2; done
  [ -n "$serial" ] || stop "$avd did not appear within 2 minutes; see $log"
fi

booted() { [ "$(adb -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; }
for _ in $(seq 90); do booted && break; sleep 2; done
booted || stop "$serial did not finish booting within 3 minutes"

adb -s "$serial" shell pm path "$app" >/dev/null 2>&1 ||
  stop "$app is not installed on $serial; build and install it (rn-dev, Commands)"

curl -fsS -m 5 "http://localhost:$port/status" 2>/dev/null | grep -q 'packager-status:running' ||
  stop "no Metro on port $port; start it with the debug skill"
owner=$(readlink "/proc/$(lsof -ti tcp:"$port" -sTCP:LISTEN | head -1)/cwd" || true)
[ "$owner" = "$root" ] || stop "the Metro on port $port is ${owner:-unknown}'s, not $root's; use METRO_PORT"
adb -s "$serial" reverse "tcp:$port" "tcp:$port" >/dev/null

echo "$serial"
