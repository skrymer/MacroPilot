#!/usr/bin/env bash
# PreToolUse and PostToolUse on Bash (`pre` / `post`): production code is written with Edit or
# Write, where probity judges it, never through Bash, where nothing does. Probity matches
# Write|Edit|NotebookEdit only, and a `python3 - <<'EOF' … open(p, 'w')` that rewrites src/ is seen by no gate.
#
# It compares files rather than parsing the command. A matcher has to anticipate `>`, `tee`,
# `sed -i`, `cp`, `mv`, `perl -pi`, and still loses to a heredoc'd interpreter. So `pre` hashes
# every guarded file, writing each blob to git's object store, and `post` hashes again. A guarded
# file that changed is put back from its blob, one the command created is removed, and Claude is
# told which, with exit 2.
#
# - The guarded set is probity's own: the `files` globs of probity.config.ts, so the two cannot
#   drift. The config is read as text, not evaluated, to keep Node off every Bash call; a test
#   pins the read to what the config exports.
# - The command's checkout and the session's are snapshotted, plus any other worktree the
#   command names by path or directory, each against its own config, so a command that cd's or
#   names a path into another checkout is covered (follow the checkout, not the session). Unnamed worktrees are left out because other sessions edit them concurrently. A path
#   built in a variable gets past this; the guard catches slipped discipline, not an adversary.
# - Allowed through: a file left as HEAD has it (`git checkout`/`git restore` is a revert, and
#   `git pull`/`switch` move HEAD with the files); a lone `prettier --write` or `eslint --fix`,
#   which reformat but add no behaviour, and only when nothing is chained onto them; and, while a
#   merge, rebase, cherry-pick or revert is stopped on a conflict, an unmerged file or one left as
#   the merge staged it, which a rollback would silently resolve to one side.
# - Not allowed: anything else, `git stash apply` and `pop` included. Set work aside with a WIP
#   commit. A rolled-back write is unstaged too, and its content is kept as a blob the message
#   names, so a rollback never loses work.
# - The pair is keyed by `tool_use_id`. A `post` with no snapshot (the hook added mid-session, a
#   crash) rolls nothing back, nor does a checkout whose config the command removed.
# - Known gaps, accepted because the guard catches slipped discipline, not an adversary:
#   - A `run_in_background` command returns before it writes, so `post` sees nothing. Background
#     use here is Metro and long test runs, which write no guarded file.
#   - A write committed by the same command (`… && git commit -am x`) matches HEAD and passes.
#     Telling it from a rebase or merge, which also leave new content at a new HEAD, is not worth
#     the misfires.
#   - An Edit that lands in a snapshotted checkout while the command runs, as one made in parallel
#     with it would, is rolled back as if Bash wrote it. Its content is kept, as above.
set -uo pipefail
shopt -s nullglob

globs() {
  sed -n '/files: \[/,/\]/p' "$1/probity.config.ts" | grep -o "'[^']*'" | tr -d "'"
}

# A glob as git pathspecs: `{a,b}` expanded, `!x` turned into an exclusion.
expand() {
  local glob="$1"
  if [[ "$glob" =~ ^(.*)\{([^}]*)\}(.*)$ ]]; then
    local head="${BASH_REMATCH[1]}" tail="${BASH_REMATCH[3]}" alt
    IFS=, read -ra alts <<<"${BASH_REMATCH[2]}"
    for alt in "${alts[@]}"; do expand "$head$alt$tail"; done
  elif [[ "$glob" == '!'* ]]; then
    echo ":(exclude)${glob#!}"
  else
    echo ":(glob)$glob"
  fi
}

# `path<TAB>blob` for every guarded file in the checkout. Extra arguments go to hash-object: `pre`
# passes -w, so the post hook can put each blob back.
hashes() {
  local root="$1" paths glob
  shift
  mapfile -t specs < <(globs "$root" | while read -r glob; do expand "$glob"; done)
  # No globs would make the pathspec empty, and ls-files would list every file.
  [ "${#specs[@]}" -gt 0 ] || return 1
  paths="$(git -C "$root" -c core.quotePath=false ls-files --cached --others --exclude-standard -- "${specs[@]}" |
    while read -r p; do [ -f "$root/$p" ] && echo "$p"; done)"
  [ -n "$paths" ] || return 0
  paste <(echo "$paths") <(cd "$root" && git hash-object "$@" --stdin-paths <<<"$paths")
}

roots() {
  local -A own=()
  local dir root dirs name
  mapfile -t dirs < <(printf '%s\n' "${cwd:-$PWD}" "${CLAUDE_PROJECT_DIR:-}" | sed '/^$/d' | sort -u)
  for dir in "${dirs[@]}"; do
    root="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" && own[$root]=1
  done
  for dir in "${dirs[@]}"; do
    git -C "$dir" worktree list --porcelain 2>/dev/null |
      awk '/^worktree / { p = substr($0, 10) } /^bare$/ { p = "" } /^$/ && p { print p; p = "" }'
  done | sort -u | while read -r root; do
    [ -f "$root/probity.config.ts" ] || continue
    name="${root##*/}"
    [[ -n "${own[$root]:-}" || "$command" =~ (^|[^[:alnum:]_.-])"$name"($|[^[:alnum:]_.-]) ]] &&
      echo "$root"
  done
}

# Puts back every guarded file in a snapshot's checkout that changed, and names each one.
rollback() {
  local file="$1" root p blob head state kept after_list merging=""
  local -A before=() after=() unmerged=()
  root="$(head -1 "$file")"
  while read -r state; do
    [ -e "$state" ] && merging=1
  done < <(git -C "$root" rev-parse --path-format=absolute --git-path MERGE_HEAD \
    --git-path CHERRY_PICK_HEAD --git-path REVERT_HEAD --git-path rebase-merge --git-path rebase-apply)
  if [ -n "$merging" ]; then
    while read -r p; do unmerged[$p]=1; done < <(git -C "$root" -c core.quotePath=false diff --name-only --diff-filter=U)
  fi
  while IFS=$'\t' read -r p blob; do before[$p]="$blob"; done < <(tail -n +2 "$file")
  # A config the command removed or emptied leaves nothing to compare against: judge nothing.
  after_list="$(hashes "$root")" || return
  while IFS=$'\t' read -r p blob; do [ -n "$p" ] && after[$p]="$blob"; done <<<"$after_list"
  while read -r p; do
    [ -n "$p" ] || continue
    [ "${before[$p]:-}" = "${after[$p]:-}" ] && continue
    head="$(git -C "$root" rev-parse -q --verify "HEAD:$p" 2>/dev/null)"
    [ "${after[$p]:-}" = "$head" ] && continue
    if [ -n "$merging" ]; then
      [ -n "${unmerged[$p]:-}" ] && continue
      [ "${after[$p]:-}" = "$(git -C "$root" rev-parse -q --verify ":$p" 2>/dev/null)" ] && continue
    fi
    kept=""
    deleted=""
    [ -f "$root/$p" ] || deleted=1
    [ -f "$root/$p" ] && kept="$(git -C "$root" hash-object -w "$root/$p")"
    if [ -n "${before[$p]:-}" ]; then
      mkdir -p "$(dirname "$root/$p")"
      git -C "$root" cat-file blob "${before[$p]}" >"$root/$p"
    else
      rm -f "$root/$p"
    fi
    # Staged too: unstage it, or the next commit records what was just rolled back.
    if [ -n "$kept" ] && [ "$(git -C "$root" rev-parse -q --verify ":$p" 2>/dev/null)" = "$kept" ]; then
      git -C "$root" reset -q -- "$p"
    fi
    echo "$root/$p${kept:+ (the Bash version is kept: git cat-file -p $kept)}${deleted:+ (deleted)}"
  done < <(printf '%s\n' "${!before[@]}" "${!after[@]}" | sort -u)
}

mode="${1:-}"
if [ "$mode" = globs ]; then
  globs "$2"
  exit 0
fi
if ! command -v jq >/dev/null; then
  echo "No jq, so a Bash write to production code cannot be caught: install jq." >&2
  exit 2
fi
{
  IFS= read -r -d '' id
  IFS= read -r -d '' cwd
  IFS= read -r -d '' command
} < <(jq -j '(.tool_use_id // ""), "\u0000", (.cwd // ""), "\u0000", (.tool_input.command // ""), "\u0000"')
[ -n "$id" ] || exit 0
snapshot="${TMPDIR:-/tmp}/bash-write-guard/$id"

case "$mode" in
  pre)
    formatter='^[[:space:]]*(npx[[:space:]]+|node_modules/\.bin/)?(prettier[[:space:]].*--write|eslint[[:space:]].*--fix)'
    if [[ "$command" =~ $formatter && ! "$command" =~ [\;\&\|\<\>\`\$] && "$command" != *$'\n'* ]]; then
      exit 0
    fi
    # A snapshot whose post never ran (the command was denied) is pruned after a day.
    find "${snapshot%/*}" -mindepth 1 -maxdepth 1 -mmin +1440 -exec rm -rf {} + 2>/dev/null
    mkdir -p "$snapshot"
    while read -r root; do
      { echo "$root" && hashes "$root" -w; } >"$snapshot/${root//\//%}"
    done < <(roots)
    ;;
  post)
    [ -d "$snapshot" ] || exit 0
    changed="$(for file in "$snapshot"/*; do rollback "$file"; done)"
    rm -rf "$snapshot"
    [ -n "$changed" ] || exit 0
    {
      echo "Rolled back production code written through Bash, which probity never sees:"
      sed 's/^/  /' <<<"$changed"
      echo "Change these with Edit or Write, so probity can judge the change."
      if grep -q ' (deleted)$' <<<"$changed"; then
        echo "Edit and Write cannot delete. Stop and ask the user to run this, before building on it:"
        sed -n 's/^\(.*\) (deleted)$/  rm \1/p' <<<"$changed"
      fi
    } >&2
    exit 2
    ;;
esac
