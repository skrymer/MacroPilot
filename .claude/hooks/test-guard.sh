#!/usr/bin/env bash
# PreToolUse on Write and Edit: refuses a write that would change or remove a committed test. The
# judging is test-guard.mjs's, which reads the tests with the TypeScript parser.
set -uo pipefail
exec node "$(dirname "${BASH_SOURCE[0]}")/test-guard.mjs"
