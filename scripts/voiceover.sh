#!/usr/bin/env bash
# Generate the voiceover for one reel from its script: TTS per scene and
# segment, exact pauses, normalise, transcribe for captions, write
# public/audio/<reel>/ and src/reels/<reel>/voice/generated.ts.
#   scripts/voiceover.sh <client> <reelId> [--voice <preset | provider/voiceId>] [--force] [--model small|medium] [--no-transcribe] [--recaption]
#   scripts/voiceover.sh <client> <reelId> --list-voices     # presets of all layers, installed Piper voices
# Example:
#   scripts/voiceover.sh acme-videos v2-2
# Input is projects/<client>/src/reels/<reelId>/script.md (or script.ts); voices
# are presets from assets/voices/presets.json → <client>/src/brand/voices.json →
# <reel>/voices.json. Keys come from .env (git-ignored) at the harness root; the
# free local Piper presets need none.
# The first run installs whisper.cpp and a model into packages/pipeline/.whisper (minutes).
set -euo pipefail
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -d "$HARNESS_DIR/packages/pipeline/node_modules" ] || (cd "$HARNESS_DIR/packages/pipeline" && npm install --no-audit --no-fund)
exec node "$HARNESS_DIR/packages/pipeline/voiceover/voiceover.mjs" "$@"
