#!/usr/bin/env bash
# PreToolUse: probity, run from the checkout the file being written is in. Probity finds its config
# from its working directory and anchors the config's `files` globs at the config's own directory.
# Claude Code runs a hook from the session's directory, so from a session started in the main
# checkout a worktree's `src/…` is judged by main's config, matches none of its globs, and every
# edit there goes through unjudged. Run from the file's own checkout, it is judged by that
# checkout's config. A file in no checkout is judged from the session's project as before.
set -uo pipefail

input="$(cat)"
file="$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' <<<"$input")"

root="${CLAUDE_PROJECT_DIR:-$PWD}"
if [ -n "$file" ]; then
  # A Write may create the file's directory, so look from the nearest one that exists.
  dir="$(dirname "$file")"
  while [ ! -d "$dir" ]; do dir="$(dirname "$dir")"; done
  root="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" || root="${CLAUDE_PROJECT_DIR:-$PWD}"
fi

cd "$root" || exit 2
if [ ! -x node_modules/.bin/probity ]; then
  echo "No probity in $root, so $file cannot be judged: run npm ci there." >&2
  exit 2
fi
# Claude Code lets a write through on any exit but 2, so a probity that crashed would wave every
# edit through unjudged. Only its own verdicts, allow (0) and refuse (2), pass as they are.
node_modules/.bin/probity --agent claude-code <<<"$input"
status=$?
case $status in
  0 | 2) exit "$status" ;;
  *)
    echo "probity failed (exit $status), so $file could not be judged: refusing the write." >&2
    exit 2
    ;;
esac
