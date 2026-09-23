#!/usr/bin/env bash
# Render stills at given frames for visual verification (inspect before
# claiming a scene is done). Output: projects/<client>/out/verify/<Comp>_<frame>.png
#   scripts/verify.sh <client> <CompositionId> <frame> [frame ...]
# Example:
#   scripts/verify.sh acme-videos MainComp 15 90 300 600
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT="${1:?client folder name under projects/}"
COMP="${2:?composition id}"
shift 2
[ $# -ge 1 ] || { echo "give at least one frame number" >&2; exit 2; }

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

mkdir -p out/verify
for f in "$@"; do
  remotion_retry still src/index.ts "$COMP" "out/verify/${COMP}_${f}.png" --frame "$f" --overwrite $BUNDLE_FLAG
  BUNDLE_FLAG=""
  touch "$STAMP"
done
echo "stills in $PROJECT/out/verify/ — open them and check text overflow, safe zones, layer order, contrast."
