#!/usr/bin/env bash
# Create a new client repository under projects/<name>/ from the client-repo
# skeleton plus a Remotion format template.
#   scripts/new-project.sh <client-name> [format]
#   formats: insta-reel (default, 1080x1920) | landscape-1080p (1920x1080) | square (1080x1080)
# The new folder is an independent git repository (local only, no remote).
# It is added to projects.yaml (git-ignored) so clone-project.sh knows about it.
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="${1:-}"
FORMAT="${2:-insta-reel}"

usage() {
  sed -n '2,7p' "$0"; exit 1
}
[ -n "$NAME" ] || usage
[[ "$NAME" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "name must be lowercase letters, digits, dashes" >&2; exit 1; }
SKELETON="$HARNESS_DIR/templates/client-repo"
TEMPLATE="$HARNESS_DIR/templates/$FORMAT"
DEST="$HARNESS_DIR/projects/$NAME"
[ -d "$TEMPLATE" ] || { echo "unknown format '$FORMAT'. Available:"; ls -1 "$HARNESS_DIR/templates" | grep -v client-repo; exit 1; }
[ -e "$DEST" ] && { echo "projects/$NAME already exists" >&2; exit 1; }

echo "Creating client repository projects/$NAME (format: $FORMAT)"
mkdir -p "$DEST"
cp -r "$SKELETON/." "$DEST/"
# tar instead of cp -r: the templates carry installed node_modules (post-create) and out/,
# which must not be copied — npm install below links and installs for the new project.
tar -C "$TEMPLATE" --exclude=./node_modules --exclude=./out -cf - . | tar -C "$DEST" -xf -
sed -i "s/PROJECT_NAME/$NAME/g" "$DEST/package.json"
sed -i "s/CLIENT_NAME/$NAME/g" "$DEST"/agents/rules/*.md

# independent local git repository
# Inherit the harness repo's local git identity (per-repo, never the global default).
H_NAME="$(git -C "$HARNESS_DIR" config --local user.name 2>/dev/null || true)"
H_MAIL="$(git -C "$HARNESS_DIR" config --local user.email 2>/dev/null || true)"
( cd "$DEST" && git init -q -b main . && git config core.autocrlf false \
  && { [ -n "$H_NAME" ] && git config user.name "$H_NAME"; [ -n "$H_MAIL" ] && git config user.email "$H_MAIL"; true; } \
  && git add -A && git commit -q -m "Initialize $NAME from harness templates ($FORMAT)" )

# generated agent instructions
bash "$HARNESS_DIR/scripts/sync-agents.sh" --client "$DEST" >/dev/null
( cd "$DEST" && git add AGENTS.md && git commit -q -m "Generate AGENTS.md" )

# manifest entry (git-ignored file)
MANIFEST="$HARNESS_DIR/projects.yaml"
[ -f "$MANIFEST" ] || { cp "$HARNESS_DIR/projects.example.yaml" "$MANIFEST"; sed -i '/^  - name: example-client-videos/,$d' "$MANIFEST"; }
grep -q "name: $NAME\$" "$MANIFEST" || printf '  - name: %s\n    remote:\n    branch: main\n    notes:\n' "$NAME" >> "$MANIFEST"

if command -v npm >/dev/null 2>&1; then
  ( cd "$DEST" && npm install --no-audit --no-fund )
else
  echo "npm not available here; dependencies are installed by post-create.sh inside the container."
fi

cat <<EOF

Created projects/$NAME
  next: onboard the client — tell your agent "onboard client $NAME" (skill: .agents/skills/onboarding-clients),
        or fill agents/rules/00-client-profile.md, 10-brand.md, 20-legal.md, src/brand/theme.ts yourself;
        check with scripts/check-client.sh $NAME
  dev:  cd projects/$NAME && npm run dev        (Studio on localhost:3000)
  render (no Studio): scripts/render.sh $NAME MainComp
Assets go to public/images, public/audio, public/fonts, public/video (staticFile('images/x.png')).
EOF
