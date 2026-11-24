#!/usr/bin/env bash
# PreToolUse on Bash: a command that commits or pushes may not pipe a gate into tail, head or grep. The
# pipe's status is the filter's, so a failing suite commits, and a refused push loses the reason. `set
# -e` does not help; `pipefail` does, and is let through.
#
# What is quoted or in a heredoc is data, such as a commit message that talks of this, and is not read.
# It catches slipped discipline, not an adversary.
set -uo pipefail

command="$(jq -r '.tool_input.command // empty')"
[[ "$command" =~ git[[:space:]]+(commit|push) ]] || exit 0

code="$(perl -0pe '
  s/<<-?\s*(["\x27]?)(\w+)\1([^\n]*)\n.*?\n\s*\2(?=\s|\z)/$3/gs;
  s/\x27[^\x27]*\x27//g;
  s/"(?:[^"\\]|\\.)*"//gs;
' <<<"$command")"

[[ "$code" =~ git[[:space:]]+(commit|push) ]] || exit 0
[[ "$code" =~ pipefail ]] && exit 0

gate='(npx[[:space:]]+(jest|tsc|eslint|prettier|expo)|(^|[^[:alnum:]_/.-])jest|npm[[:space:]]+(test|run|ci|t)|git[[:space:]]+push)'
if grep -Eq "${gate}[^|;&]*(&>?1?[^|;&]*)?(2>&1[^|;&]*)?\|&?[[:space:]]*(tail|head|grep)\b" <<<"$code"; then
  {
    echo "A gate is piped into a filter in a command that commits or pushes, so its own status is lost."
    echo "Send its output to a file and check the status: npx jest >\"\$log\" 2>&1; echo \$?"
    echo "A push that fails and then passes is a flake: find it before anything else."
  } >&2
  exit 2
fi
