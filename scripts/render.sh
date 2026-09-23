#!/usr/bin/env bash
# Headless render of one composition. Never starts Remotion Studio.
#   scripts/render.sh <client> <CompositionId> [output-name] [-- extra remotion args]
# Example:
#   scripts/render.sh acme-videos MainComp                 -> projects/acme-videos/out/MainComp.mp4
#   scripts/render.sh acme-videos MainComp final -- --crf 17
# Runs inside the devcontainer (needs node). From Windows use:
#   docker compose run --rm render acme-videos MainComp
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT="${1:?client folder name under projects/}"
COMP="${2:?composition id}"
NAME="${3:-$COMP}"
shift $(( $# >= 3 ? 3 : $# ))
[ "${1:-}" = "--" ] && shift

PROJECT="$HARNESS_DIR/projects/$CLIENT"
[ -f "$PROJECT/package.json" ] || { echo "no project at $PROJECT" >&2; exit 1; }
cd "$PROJECT"
[ -d node_modules ] || npm install --no-audit --no-fund

# Remotion keeps a persistent webpack bundle cache per project. It does not
# notice edits to the linked @harness/visuals package (reached through a
# symlink with resolve.symlinks=false), so a stale bundle can keep exporting an
# old module graph — components come back undefined at render time while
# TypeScript is happy. Clear the cache once whenever the package is newer than
# the last render from this project.
STAMP="node_modules/.harness-visuals.stamp"
BUNDLE_FLAG=""
if [ ! -f "$STAMP" ] || [ -n "$(find "$HARNESS_DIR/packages" -type f -newer "$STAMP" -print -quit 2>/dev/null)" ]; then
  BUNDLE_FLAG="--bundle-cache=false"
fi

# Remotion gives Chrome a fixed 25 s to come up. Right after heavy disk I/O
# (model downloads, a whisper build, a rebuilt image) a cold start can take
# longer and fails with "Timed out … while trying to connect to the browser".
# The second attempt starts warm; retry exactly once on that error.
remotion_retry() {
  local out
  if out=$(npx remotion "$@" 2>&1); then printf "%s\n" "$out"; return 0; fi
  if printf "%s" "$out" | grep -q "trying to connect to the browser"; then
    echo "browser did not come up in time (cold start) — retrying once" >&2
    npx remotion "$@"
  else
    printf "%s\n" "$out" >&2; return 1
  fi
}

mkdir -p out
remotion_retry render src/index.ts "$COMP" "out/$NAME.mp4" --overwrite $BUNDLE_FLAG "$@"
touch "$STAMP"
echo "rendered $PROJECT/out/$NAME.mp4"
