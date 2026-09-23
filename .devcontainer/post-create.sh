#!/usr/bin/env bash
# Runs once after the devcontainer is created (and on rebuild).
# Idempotent: safe to run again with  bash .devcontainer/post-create.sh
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HARNESS_DIR"

echo "=== Remotion video harness: post-create ==="

# 1. Agent Skills (official Remotion skills) at the harness root.
#    Installs into .agents/skills and links .claude/skills to it. Skills load
#    from parent directories, so one install serves every client project.
echo "--- Agent skills"
if npx --yes remotion skills add >/dev/null 2>&1 || npx remotion skills update >/dev/null 2>&1; then
  echo "  official Remotion skills installed/updated in .agents/skills"
else
  echo "  WARNING: 'npx remotion skills add' failed; skills not updated" >&2
fi
if [ -d .agents/skills ]; then
  if [ ! -e .claude/skills ]; then
    ln -s ../.agents/skills .claude/skills 2>/dev/null && echo "  .claude/skills -> .agents/skills (symlink)" \
      || { cp -r .agents/skills .claude/skills && echo "  .claude/skills copied (symlink not supported here)"; }
  elif [ -d .claude/skills ] && [ ! -L .claude/skills ]; then
    # Old layout: a real directory with the stale single-skill copy.
    if [ -d .claude/skills/remotion ] && [ ! -d .agents/skills/remotion ]; then
      rm -rf .claude/skills/remotion && echo "  removed stale .claude/skills/remotion"
    fi
    # keep as a copy, refresh it
    rm -rf .claude/skills && { ln -s ../.agents/skills .claude/skills 2>/dev/null || cp -r .agents/skills .claude/skills; }
    echo "  .claude/skills refreshed"
  fi
fi

# 2. Generated agent instructions must be current.
echo "--- Agent instructions"
bash scripts/sync-agents.sh --check || bash scripts/sync-agents.sh
for c in projects/*/; do
  [ -f "${c}agents/rules/00-client-profile.md" ] || continue
  bash scripts/sync-agents.sh --check --client "$c" || bash scripts/sync-agents.sh --client "$c"
done

# 2b. One installed format template: templates/insta-reel is the harness's own
#     consumer of @harness/visuals and @harness/pipeline — the type-check hook
#     checks package edits through it and the pipeline's loader test takes
#     esbuild from it. The other templates stay uninstalled (400 MB each,
#     unused; new-project.sh installs into the new project itself).
if [ ! -d templates/insta-reel/node_modules ]; then
  echo "--- Installing templates/insta-reel (package type-check consumer)"
  (cd templates/insta-reel && npm install --no-audit --no-fund)
fi

# 3. Client projects: install dependencies, check harness version.
echo "--- Client projects"
HARNESS_TAG="$(git describe --tags --abbrev=0 2>/dev/null || echo 'untagged')"
for c in projects/*/; do
  [ -f "${c}package.json" ] || continue
  name="$(basename "$c")"
  want="$(sed -n 's/.*"harnessVersion": *"\([^"]*\)".*/\1/p' "${c}package.json")"
  if [ -n "$want" ] && [ "$HARNESS_TAG" != "untagged" ] && [ "v$want" != "$HARNESS_TAG" ] && [ "$want" != "$HARNESS_TAG" ]; then
    echo "  WARNING: $name expects harness $want, checked out is $HARNESS_TAG" >&2
  fi
  bash scripts/check-client.sh "$c" >/dev/null 2>&1 || echo "  NOTE: $name is NOT READY (onboarding incomplete) — run scripts/check-client.sh $name"
  if [ ! -d "${c}node_modules" ]; then
    echo "  installing dependencies for $name"
    (cd "$c" && npm install --no-audit --no-fund)
  else
    echo "  $name: dependencies present"
  fi
done

# 4. Secrets reminder.
[ -f .env ] || echo "--- No .env found. Copy .env.example to .env for voiceover/TTS keys (git-ignored)."

echo "=== Ready. See HOWTO.md ==="
