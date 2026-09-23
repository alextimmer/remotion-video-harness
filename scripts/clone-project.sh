#!/usr/bin/env bash
# Restore client repositories listed in projects.yaml into projects/<name>/.
#   scripts/clone-project.sh          clone every missing project
#   scripts/clone-project.sh <name>   clone one project
# projects.yaml is git-ignored; projects.example.yaml shows the format.
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$HARNESS_DIR/projects.yaml"
ONLY="${1:-}"

if [ ! -f "$MANIFEST" ]; then
  echo "projects.yaml not found. Copy projects.example.yaml to projects.yaml and fill it in." >&2
  exit 1
fi

# Parse the flat list: "- name: x" starts an entry, indented "key: value" lines belong to it.
awk '
  /^[[:space:]]*-[[:space:]]*name:/ { if (name) print name "\t" remote "\t" branch; name=$0; sub(/.*name:[[:space:]]*/, "", name); remote=""; branch="main"; next }
  /^[[:space:]]+remote:/ { remote=$0; sub(/.*remote:[[:space:]]*/, "", remote) }
  /^[[:space:]]+branch:/ { branch=$0; sub(/.*branch:[[:space:]]*/, "", branch) }
  END { if (name) print name "\t" remote "\t" branch }
' "$MANIFEST" | while IFS=$'\t' read -r name remote branch; do
  [ -n "$ONLY" ] && [ "$ONLY" != "$name" ] && continue
  dest="$HARNESS_DIR/projects/$name"
  if [ -d "$dest/.git" ]; then
    echo "present  $name"
    continue
  fi
  if [ -z "$remote" ]; then
    echo "skip     $name (no remote configured yet)"
    continue
  fi
  echo "cloning  $name <- $remote ($branch)"
  git clone --branch "$branch" "$remote" "$dest"
done
