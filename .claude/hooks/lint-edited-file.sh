#!/usr/bin/env bash
# PostToolUse: lint the file Claude just wrote, so a design or a11y violation
# surfaces at the edit that caused it rather than in CI. Exit 2 hands ESLint's
# report back to Claude; anything that is not a .ts/.tsx file is left alone.
set -uo pipefail

file="$(jq -r '.tool_input.file_path // empty')"
case "$file" in
  *.ts | *.tsx) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0

# Lint from the checkout the file is in, not the session's project: a file in a
# worktree lies outside the main checkout, which ESLint ignores without a word.
root="$(git -C "$(dirname "$file")" rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$root" || exit 0
if [ ! -x node_modules/.bin/eslint ]; then
  echo "No ESLint in $root, so $file was not linted: run npm ci there." >&2
  exit 2
fi

if ! report="$(node_modules/.bin/eslint --no-warn-ignored "$file" 2>&1)"; then
  echo "$report" >&2
  exit 2
fi
