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

# An edit sent beside a refused one was written on the refused one's account, so it is refused
# unjudged: one that passes alone would build on a change that is not there. The rest of the
# refused edit's message is kept, by its tool calls' ids, in a file named after the transcript.
transcript="$(jq -r '.transcript_path // empty' <<<"$input")"
id="$(jq -r '.tool_use_id // empty' <<<"$input")"
refused=""
if [ -n "$transcript" ] && [ -n "$id" ]; then
  refused="${TMPDIR:-/tmp}/probity-refused-$(md5sum <<<"$transcript" | cut -c1-16)"
  if [ -f "$refused" ] && grep -qxF "$id" "$refused"; then
    echo "Refused unjudged: an edit in the same message was refused, and this one may build on it. Send it again on its own once that one is in." >&2
    exit 2
  fi
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
if [ "$status" = 2 ] && [ -n "$refused" ] && [ -f "$transcript" ]; then
  # Claude Code writes each block of a message as a line of its own, under the message's id.
  message="$(jq -r --arg id "$id" 'select(.type == "assistant") | select(any(.message.content[]?; .type == "tool_use" and .id == $id)) | .message.id' "$transcript" | head -1)"
  [ -n "$message" ] && jq -r --arg m "$message" 'select(.message.id? == $m) | .message.content[]? | select(.type == "tool_use") | .id' "$transcript" >"$refused"
fi
case $status in
  0 | 2) exit "$status" ;;
  *)
    echo "probity failed (exit $status), so $file could not be judged: refusing the write." >&2
    exit 2
    ;;
esac
