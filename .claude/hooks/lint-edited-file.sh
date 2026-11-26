#!/usr/bin/env bash
# PostToolUse: lint the file Claude just wrote, so a design or a11y violation
# surfaces at the edit that caused it rather than in CI, and check its formatting.
# Exit 2 hands the report back to Claude. ESLint takes .ts/.tsx files; Prettier
# takes any file it knows, and passes over the rest.
set -uo pipefail

file="$(jq -r '.tool_input.file_path // empty')"
[ -n "$file" ] && [ -f "$file" ] || exit 0

# Lint from the checkout the file is in, not the session's project: a file in a
# worktree lies outside the main checkout, which ESLint ignores without a word.
root="$(git -C "$(dirname "$file")" rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$root" || exit 0

case "$file" in
  *.ts | *.tsx)
    if [ ! -x node_modules/.bin/eslint ]; then
      echo "No ESLint in $root, so $file was not linted: run npm ci there." >&2
      exit 2
    fi
    if ! report="$(node_modules/.bin/eslint --no-warn-ignored "$file" 2>&1)"; then
      echo "$report" >&2
      exit 2
    fi
    ;;
esac

# Checked, never written: a rewrite here would put in what probity never judged, and code
# formatted after the gates leaves their stamps on other code.
if ! report="$(node_modules/.bin/prettier --check --ignore-unknown "$file" 2>&1)"; then
  echo "$report" >&2
  echo "Prettier would format $file: make that change with Edit." >&2
  exit 2
fi
