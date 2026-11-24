#!/usr/bin/env bash
# Exempts app/prototype/ from probity and Stryker while a prototype exists, or takes the exemption out.
#   exempt.sh on | off | status
# Idempotent: each negation sits on the line after `'!app/design.tsx',`, at its indentation.
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
files=("$root/probity.config.ts" "$root/stryker.config.mjs")
negation="'!app/prototype/**',"

case "${1:-}" in
  on)
    for f in "${files[@]}"; do
      grep -qF "$negation" "$f" && continue
      grep -qF "'!app/design.tsx'," "$f" || { echo "no '!app/design.tsx', line in $f to anchor on" >&2; exit 1; }
      sed -i "s|^\( *\)'!app/design.tsx',\$|&\n\1$negation|" "$f"
    done
    ;;
  off)
    for f in "${files[@]}"; do sed -i "/^ *'!app\/prototype\/\*\*',\$/d" "$f"; done
    ;;
  status) ;;
  *)
    echo "usage: exempt.sh on | off | status" >&2
    exit 2
    ;;
esac

for f in "${files[@]}"; do
  if grep -qF "$negation" "$f"; then echo "exempt:     ${f#"$root"/}"; else echo "not exempt: ${f#"$root"/}"; fi
done
