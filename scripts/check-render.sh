#!/usr/bin/env bash
# Measure a rendered MP4 the way the delivery review does, in one command:
# frame count, duration, audio stream and loudness, first/last frame brightness
# and a black-tail count. Prints a short report; exit 1 when a hard defect is
# found (black tail, missing file). Used by hand and by the Claude Code
# PostToolUse hook after scripts/render.sh.
#   scripts/check-render.sh <client> <path-to-mp4 relative to the project | absolute>
set -uo pipefail
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT="${1:?client}"; IN="${2:?mp4 (relative to projects/<client>/ or absolute)}"
case "$IN" in /*) FILE="$IN";; *) FILE="$HARNESS_DIR/projects/$CLIENT/$IN";; esac
[ -f "$FILE" ] || { echo "check-render: no such file: $FILE"; exit 1; }

frames=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$FILE" | tr -d ',')
fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$FILE" | head -1 | tr -d "," | awk -F/ '{printf "%.0f", $1/$2}')
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$FILE")
size=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$FILE" | head -1 | sed "s/,$//; s/,/x/")
acodec=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate -of csv=p=0:s=/ "$FILE")

# brightness: first frame, last frame, and how many of the final 2 s are black (YAVG < 16)
yfirst=$(ffmpeg -hide_banner -loglevel info -i "$FILE" -frames:v 1 -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null - 2>&1 | grep -o 'YAVG=[0-9.]*' | tail -1 | cut -d= -f2)
tail_vals=$(ffmpeg -hide_banner -loglevel info -sseof -2 -i "$FILE" -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null - 2>&1 | grep -o 'YAVG=[0-9.]*' | cut -d= -f2)
ylast=$(echo "$tail_vals" | tail -1)
black_tail=$(echo "$tail_vals" | awk 'BEGIN{n=0} {if ($1 < 16) n++; else n=0} END{print n}')

fail=0
printf 'check-render  %s\n' "${FILE#$HARNESS_DIR/}"
printf '  video   %s frames, %s fps, %.2f s, %s\n' "$frames" "$fps" "$dur" "$size"
if [ -n "$acodec" ]; then
  loud=$(ffmpeg -hide_banner -nostats -i "$FILE" -af ebur128=peak=true -f null - 2>&1 | awk '/Integrated loudness/{f=1} f&&/I:/{i=$2} f&&/Peak:/{p=$2} END{printf "%s LUFS integrated, %s dBTP", i, p}')
  printf '  audio   %s — %s (delivery target −14 LUFS / ≤ −1 dBTP; run scripts/master.sh if this is a delivery)\n' "$acodec" "$loud"
else
  printf '  audio   none (silent — fine only if the user decided so for this reel; 22-craft-audio.md)\n'
fi
printf '  frames  first YAVG %s, last YAVG %s\n' "${yfirst:-?}" "${ylast:-?}"
if [ "${black_tail:-0}" -gt 0 ]; then
  printf '  FAIL    black tail: the last %s frame(s) are black — DURATION_FRAMES is longer than the scenes minus transitions (rule 21)\n' "$black_tail"; fail=1
else
  printf '  ok      no black tail\n'
fi
exit $fail
