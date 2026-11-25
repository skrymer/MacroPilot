---
name: debug
description: Starts Metro in the background for the development build with its output in a log file the agent can read. Use during a /verify walk-through, when a runtime defect needs evidence from the device, when the app needs a Metro the agent can read, or when the user says "debug this on the phone".
---

# Debug

```bash
.claude/skills/debug/scripts/metro.sh <scratchpad>/metro.log   # with run_in_background
```

It stops this checkout's own stale Metro on port 8081 (or `METRO_PORT`), starts a new one over LAN without `CI=1`, and prints the address the phone should reach. **Exit 3 means another checkout holds the port**: never stop it, run with `METRO_PORT=8082`.

Then the phone: same Wi-Fi, **force-quit and reopen the app**. The emulator: `drive-emulator`'s `emulator.sh`, which takes `METRO_PORT` too.

- A fresh `Bundled` line after an edit is the only proof the device runs it.
- A class new to the codebase needs `metro.sh <metro.log> --clear`. A start by hand inside another command dies with it, and what is driven after tests nothing.
- There is no event log in the app yet. The first defect that needs a timeline earns one: a port for the development console, recorded in [`0001`](../../../docs/adr/0001-a-unit-owes-its-own-test-when-it-owns-something.md), and a reader script here.
