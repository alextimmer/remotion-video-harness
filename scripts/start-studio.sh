#!/usr/bin/env bash
# Start Remotion Studio for a client project (preview only; rendering never needs it).
#   scripts/start-studio.sh <client>        e.g. scripts/start-studio.sh acme-videos
#   scripts/start-studio.sh                 inside a project folder
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -n "${1:-}" ]; then
  PROJECT_DIR="$HARNESS_DIR/projects/$1"
elif [ -f package.json ] && grep -q '"remotion"' package.json; then
  PROJECT_DIR="$(pwd)"
else
  echo "Usage: scripts/start-studio.sh <client>"; echo "Available:"
  for d in "$HARNESS_DIR"/projects/*/; do [ -f "${d}package.json" ] && echo "  - $(basename "$d")"; done
  exit 1
fi
[ -f "$PROJECT_DIR/package.json" ] || { echo "no project at $PROJECT_DIR" >&2; exit 1; }
cd "$PROJECT_DIR"
[ -d node_modules ] || npm install --no-audit --no-fund
echo "Studio for $(basename "$PROJECT_DIR") -> http://localhost:3000"
npx remotion studio --ipv4
