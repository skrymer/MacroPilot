#!/usr/bin/env bash
# The lines this change touched, as Stryker's --mutate list: `file:start-end` for each run of lines
# added or altered since <base>, and each untracked file whole. Tests and deleted lines are left out.
# Prints nothing when nothing is in scope.
#
#   scope.sh            fetches main, and diffs against origin/main
#   scope.sh <base>     diffs against <base>, fetching nothing
#
# origin/main, not main: a worktree's local main is rarely pulled, and a branch rebased past it would
# take everything merged in between for its own change. Committed and uncommitted work alike: the gate
# runs before the commit, which is why it is a two-dot diff against the base and never `base...HEAD`.
set -euo pipefail

if [ $# -eq 0 ]; then
  git fetch -q origin main
  base=origin/main
else
  base=$1
fi

source_file() { grep -E '^(src|app)/.*\.(ts|tsx)$' | grep -Ev '\.test\.tsx?$' || true; }

# A dynamic route's brackets are a glob to Stryker, which refuses a range on a glob: that file goes
# whole, each bracket a `?` (the `sed` below), since an escaped bracket matches nothing and only warns.
ranges=$({
  git diff --name-only --diff-filter=d "$base" -- src app | source_file | while read -r file; do
    # Each hunk header's `+start,count`; a count of 0 is a deletion, with nothing left to mutate.
    # Whitespace is ignored: a removed wrapper re-indents every line inside it, and mutating those
    # judges old code as this change's (29 unchanged survivors, judged again at each of #110's runs).
    git diff -w -U0 "$base" -- "$file" | sed -n 's/^@@ [^+]*+\([0-9,]*\) @@.*/\1/p' |
      awk -F, -v file="$file" '{
        count = ($2 == "") ? 1 : $2
        if (count > 0) printf "%s:%d-%d\n", file, $1, $1 + count - 1
      }'
  done
  git ls-files --others --exclude-standard -- src app | source_file
} | sed '/[][]/{s/:.*//;s/[][]/?/g}' | sort -u | paste -sd,)
[ -z "$ranges" ] || echo "$ranges"
