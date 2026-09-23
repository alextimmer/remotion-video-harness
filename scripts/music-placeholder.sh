#!/usr/bin/env bash
# Generate a placeholder music bed with ffmpeg (a soft two-tone pad), so the
# audio pipeline can be tested before a licensed track exists. It is generated
# in this repository and carries no third-party rights — and it is NOT for
# delivery: a licensed track is an open decision (82-open-decisions.md).
#   scripts/music-placeholder.sh <client> [seconds]   -> projects/<client>/public/audio/music/placeholder-pad.m4a
set -euo pipefail
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT="${1:?client}"; SEC="${2:-60}"
OUT="$HARNESS_DIR/projects/$CLIENT/public/audio/music"; mkdir -p "$OUT"
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "sine=frequency=110:duration=$SEC" \
  -f lavfi -i "sine=frequency=165.2:duration=$SEC" \
  -f lavfi -i "sine=frequency=220.6:duration=$SEC" \
  -filter_complex "[0][1][2]amix=inputs=3:normalize=1,lowpass=f=900,tremolo=f=0.15:d=0.35,volume=0.5,afade=t=in:d=2,afade=t=out:st=$((SEC-3)):d=3,aformat=sample_rates=48000:channel_layouts=mono" \
  -c:a aac -b:a 128k "$OUT/placeholder-pad.m4a"
echo "wrote $OUT/placeholder-pad.m4a ($SEC s) — placeholder only, see assets/music/LICENSES.md"
