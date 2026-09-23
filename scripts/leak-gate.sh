#!/usr/bin/env bash
# Leak gate: client words must never appear in harness files (rule 00, Layer A).
# The word list is YOUR data and is git-ignored: .leakwords at the harness root,
# one word per line, # comments allowed (see .leakwords.example). Matching is
# case-insensitive and substring-based on purpose (rule 81: a gate that never
# fires by accident is worth an odd identifier).
#
#   scripts/leak-gate.sh                    scan every harness file git knows about (tracked + untracked, not ignored)
#   scripts/leak-gate.sh <file>...          scan the given files
#   scripts/leak-gate.sh --staged           scan lines added in the staged diff (pre-commit)
#   scripts/leak-gate.sh --stdin <label>    scan stdin (used by the Claude Code write hook)
# Exit 0 = clean, 1 = hits (printed as file:line: word), 0 with a warning when no .leakwords exists.
set -uo pipefail
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIST="$HARNESS_DIR/.leakwords"
if [ ! -f "$LIST" ]; then
  echo "leak-gate: no $LIST — copy .leakwords.example and fill in the client words (git-ignored)" >&2
  exit 0
fi
PATTERNS="$(mktemp)"; trap 'rm -f "$PATTERNS"' EXIT
grep -vE '^\s*(#|$)' "$LIST" | sed 's/^\s*//; s/\s*$//' > "$PATTERNS"
[ -s "$PATTERNS" ] || { echo "leak-gate: $LIST has no words" >&2; exit 0; }

# Paths that legitimately hold client words or are not harness content.
EXCLUDE='^(projects/|node_modules/|\.git/|out/|docs/local/|\.leakwords$|CLAUDE\.local\.md$|projects\.yaml$|package-lock\.json$|\.agents/skills/remotion|.*/node_modules/|.*/\.whisper/|.*\.(png|jpg|jpeg|mp4|wav|m4a|onnx|bin)$)'

hits=0
case "${1:-}" in
  --stdin)
    label="${2:-stdin}"
    out=$(grep -n -i -F -o -f "$PATTERNS" | sort -u -t: -k1,1n | sed "s#^#$label:#")
    ;;
  --staged)
    out=$(cd "$HARNESS_DIR" && git diff --cached -U0 --diff-filter=ACMR -- . ':(exclude)projects' | grep -E '^(\+\+\+ b/|\+[^+])' | awk '/^\+\+\+ b\//{f=substr($0,7); next} {print f ": " substr($0,2)}' | grep -i -F -f "$PATTERNS" | grep -vE "^($EXCLUDE)" )
    ;;
  "")
    out=$(cd "$HARNESS_DIR" && git ls-files -co --exclude-standard | grep -vE "$EXCLUDE" | xargs -r grep -n -i -F -o -f "$PATTERNS" 2>/dev/null)
    ;;
  *)
    out=$(cd "$HARNESS_DIR" && printf '%s\n' "$@" | grep -vE "$EXCLUDE" | xargs -r grep -n -i -F -o -f "$PATTERNS" 2>/dev/null)
    ;;
esac
if [ -n "$out" ]; then
  echo "leak-gate: client words in harness content (rule 00 — Layer A must stay publishable):"
  echo "$out" | head -40 | sed 's/^/  /'
  n=$(echo "$out" | wc -l); [ "$n" -gt 40 ] && echo "  … $((n - 40)) more"
  exit 1
fi
exit 0
