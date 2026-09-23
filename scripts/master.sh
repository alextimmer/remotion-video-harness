#!/usr/bin/env bash
# Master a rendered reel to the delivery loudness target (22-craft-audio.md):
# two-pass loudnorm to -14 LUFS integrated, true peak -1 dBTP, video copied.
# The loudnorm target is TP=-1.3: in linear mode the result can overshoot the
# target peak by ~0.3 dB, and the deliverable must stay at or below -1.0.
# Prints the ebur128 report of the result.
#   scripts/master.sh <client> <in.mp4> [out.mp4]
# Example:
#   scripts/master.sh acme-videos out/Reel-v2-2.mp4          -> out/Reel-v2-2.mastered.mp4
set -euo pipefail
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT="${1:?client}"; IN="${2:?input mp4 (relative to the project)}"; OUT="${3:-${IN%.mp4}.mastered.mp4}"
cd "$HARNESS_DIR/projects/$CLIENT"
[ -f "$IN" ] || { echo "no such file: $IN" >&2; exit 1; }
if ! ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 "$IN" | grep -q audio; then
  echo "NO AUDIO STREAM in $IN — a silent deliverable is a failure mode (22-craft-audio.md)" >&2; exit 2
fi
echo "--- pass 1: measure"
M=$(ffmpeg -hide_banner -nostats -i "$IN" -af "loudnorm=I=-14:TP=-1.3:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$M" | grep "\"$1\"" | sed -E 's/.*: *"([^"]*)".*/\1/'; }
echo "    input: I=$(g input_i) LUFS  TP=$(g input_tp) dBTP  LRA=$(g input_lra)  thresh=$(g input_thresh)"
echo "--- pass 2: apply"
ffmpeg -hide_banner -loglevel error -y -i "$IN" -c:v copy \
  -af "loudnorm=I=-14:TP=-1.3:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true:print_format=summary" \
  -c:a aac -b:a 192k -ar 48000 "$OUT"
echo "--- result: $OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|LRA:|Peak:" | tail -3 | sed 's/^/    /'
echo "target: I -14 LUFS, true peak <= -1 dBTP"
