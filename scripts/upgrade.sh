#!/usr/bin/env bash
# Upgrade Remotion uniformly across templates and client projects, update the
# Agent Skills, and pin the same version in the Dockerfile.
#   scripts/upgrade.sh [version]     default: latest on npm
# Afterwards: rebuild the devcontainer so Chrome Headless Shell matches.
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HARNESS_DIR"
VERSION="${1:-$(npm view remotion version)}"
echo "=== Upgrading to remotion $VERSION ==="

pin() {
  # replace the version of every remotion/@remotion/* dependency in a package.json
  sed -i -E "s/(\"(remotion|@remotion\/[a-z-]+)\": *\")[^\"]+(\")/\1${VERSION}\3/g" "$1"
}

for p in templates/*/package.json projects/*/package.json packages/*/package.json; do
  [ -f "$p" ] || continue
  pin "$p"
  echo "pinned $p"
done

# Templates ship lockfiles and clients have installed trees; both must be
# refreshed or they keep resolving the old version. packages/visuals has no
# node_modules on purpose (peer dependencies only), so it is not installed.
for d in templates/*/ projects/*/; do
  [ -f "${d}package.json" ] || continue
  echo "--- npm install in $d"
  (cd "$d" && npm install --no-audit --no-fund)
done

sed -i -E "s/^ARG REMOTION_VERSION=.*/ARG REMOTION_VERSION=${VERSION}/" .devcontainer/Dockerfile
echo "Dockerfile pinned to $VERSION"

echo "--- updating Agent Skills"
npx remotion skills update || echo "skills update failed (non-fatal)" >&2

echo
echo "Done. Next: commit, then rebuild the devcontainer (Chrome Headless Shell must match)."
echo "Record the upgrade in agents/rules/80-harness-decisions.md and run scripts/sync-agents.sh."
