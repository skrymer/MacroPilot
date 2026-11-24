#!/usr/bin/env bash
# Starts Metro for the development build, writing everything it prints to a log file the agent can
# read. Run it with `run_in_background`.
#
#   metro.sh <metro.log>          on METRO_PORT, 8081 when unset
#
# - A Metro of this checkout's already on that port is stopped first, or it keeps serving the phone.
#   One belonging to another checkout is left alone and this exits 3: the port is shared between
#   sessions, so take another with METRO_PORT rather than stop it.
# - Not CI=1: CI mode turns off file watching and reloads, so every change would need a restart.
# - stdin from /dev/null: Metro's interactive prompt otherwise waits on a terminal there is none of.
set -euo pipefail

log=${1:?usage: metro.sh <metro.log>}
port=${METRO_PORT:-8081}
root=$(cd "$(dirname "$0")/../../../.." && pwd)

# Only the listener: a browser tab or debugger connected to Metro also has a socket on the port.
listener() { lsof -ti tcp:"$port" -sTCP:LISTEN; }
if pids=$(listener); then
  for pid in $pids; do
    cwd=$(readlink "/proc/$pid/cwd" || true)
    if [ "$cwd" != "$root" ]; then
      echo "metro.sh: port $port is held by pid $pid in ${cwd:-an unknown directory}, not $root; leaving it" >&2
      exit 3
    fi
  done
  echo "metro.sh: stopping what listens on port $port (pid $pids)"
  # shellcheck disable=SC2086
  kill $pids
  for _ in $(seq 25); do listener >/dev/null || break; sleep 0.2; done
  # shellcheck disable=SC2086
  if listener >/dev/null; then kill -9 $pids; sleep 0.5; fi
fi

ip=$(hostname -I | awk '{print $1}')
echo "metro.sh: logging to $log; the phone, on the same Wi-Fi, should reach http://$ip:$port"
echo "metro.sh: force-quit and reopen the app on the phone to pick this server up"

cd "$root"
unset CI
npx expo start --dev-client --lan --port "$port" </dev/null 2>&1 | tee "$log"
