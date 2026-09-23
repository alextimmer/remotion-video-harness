#!/usr/bin/env bash
# Scaffold a reel inside a client project (production skill, phase 3):
#   scripts/new-reel.sh <client> <reelId> [sceneId ...]      default scenes: hook cta
# Writes src/reels/<reelId>/
#   Reel.tsx            theme provider + voice provider + TransitionSeries with fades
#   timing.ts           deriveVoiceTiming() over the designed scene lengths (edit those)
#   script.md           one "## sceneId" per scene with a TODO spoken line
#   voice/generated.ts  placeholder index (no scenes) so the reel compiles and previews
#                       silently until scripts/voiceover.sh overwrites it
#   scenes/<Id>Scene.tsx one themed scene per id with its <Voice> line
# and registers <Composition id="Reel-<reelId>"> in src/Root.tsx, plus a reel
# note stub in agents/rules/reels/<reelId>.md. Nothing brand-specific is chosen:
# colours and fonts come from the client's visualsTheme through the package.
set -euo pipefail
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT="${1:?client name (folder under projects/)}"; REEL="${2:?reel id, e.g. origin-v1}"; shift 2 || true
SCENES=("$@"); [ ${#SCENES[@]} -gt 0 ] || SCENES=(hook cta)
DIR="$HARNESS_DIR/projects/$CLIENT"
[ -d "$DIR/src" ] || { echo "no client project at projects/$CLIENT" >&2; exit 1; }
[[ "$REEL" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "reel id must be lowercase letters, digits, dashes (no dots)" >&2; exit 1; }
R="$DIR/src/reels/$REEL"
[ -e "$R" ] && { echo "src/reels/$REEL already exists" >&2; exit 1; }
for s in "${SCENES[@]}"; do [[ "$s" =~ ^[a-zA-Z][a-zA-Z0-9-]*$ ]] || { echo "scene id '$s' must match [a-zA-Z][a-zA-Z0-9-]*" >&2; exit 1; }; done
[ -f "$DIR/src/Root.tsx" ] || { echo "src/Root.tsx missing" >&2; exit 1; }
grep -q 'export const visualsTheme' "$DIR/src/brand/theme.ts" || { echo "src/brand/theme.ts has no visualsTheme export (run the onboarding first)" >&2; exit 1; }

pascal() { echo "$1" | sed -E 's/(^|-)([a-z])/\U\2/g; s/^([a-z])/\U\1/'; }   # test-strip -> TestStrip, testStrip -> TestStrip
upper()  { echo "$1" | tr 'a-z-' 'A-Z_'; }
key()    { if [[ "$1" == *-* ]]; then echo "'$1'"; else echo "$1"; fi; }            # object key: quote ids with dashes
access() { if [[ "$1" == *-* ]]; then echo "SCENE_DURATION['$1']"; else echo "SCENE_DURATION.$1"; fi; }
REEL_PASCAL="$(pascal "$REEL")"; REEL_UPPER="$(upper "$REEL")"

mkdir -p "$R/scenes" "$R/voice"

# ---- script.md ---------------------------------------------------------------
{
  echo "# Reel $REEL — spoken text per scene (screenplay). Prose = what the voice says;"
  echo "# only approved on-screen copy or its literal expansion (client 20-legal.md)."
  echo "# \"> subtitle:\" = written form of the burnt-in subtitle where it differs,"
  echo "# only for scenes that render <Voice subtitles />. The scene's own on-screen"
  echo "# text lives in scenes/*.tsx, not here. Markers: [pause 0.4], *emphasis*."
  echo "# Voice presets: src/brand/voices.json (omit \"voice:\" for the default preset)."
  echo "# Generate: scripts/voiceover.sh $CLIENT $REEL"
  echo "pause-before: 0.4"
  echo "pause-after: 0.7"
  for s in "${SCENES[@]}"; do printf '\n## %s\nTODO spoken line for scene %s\n' "$s" "$s"; done
} > "$R/script.md"

# ---- voice/generated.ts (placeholder) ----------------------------------------
cat > "$R/voice/generated.ts" <<'EOF'
// PLACEHOLDER written by scripts/new-reel.sh — scripts/voiceover.sh overwrites it.
// No scenes yet: deriveVoiceTiming() uses the designed lengths and <Voice> renders
// nothing, so the reel compiles and previews silently before the voiceover exists.
import type {VoiceIndex} from '@harness/visuals';

export const VOICE = {
	"generatedAt": "",
	"source": "placeholder",
	"language": "",
	"pauseBeforeMs": 400,
	"pauseAfterMs": 700,
	"scenes": {}
} satisfies VoiceIndex;
EOF

# ---- timing.ts ----------------------------------------------------------------
{
  echo "// Timing for reel $REEL. Designed scene lengths in frames — edit them; the voice"
  echo "// can only lengthen a scene (max(designed, pause + clip + pause)), never shorten it."
  echo "// Brand values live in src/brand/theme.ts; the voice index is generated."
  echo "import {deriveVoiceTiming} from '@harness/visuals';"
  echo "import {FPS} from '../../brand/theme';"
  echo "import {VOICE} from './voice/generated';"
  echo
  echo "/** Overlap of the fade after each scene, in frames. */"
  echo "export const TRANSITION = 12;"
  echo
  echo "export const {VOICE_START, SCENE_DURATION, SCENE_START, DURATION_FRAMES, DUCK_WINDOWS} = deriveVoiceTiming("
  echo "	VOICE,"
  printf '	{'; for i in "${!SCENES[@]}"; do [ "$i" -gt 0 ] && printf ', '; printf '%s: 150' "$(key "${SCENES[$i]}")"; done; printf '},\n'
  echo "	{fps: FPS, transition: TRANSITION},"
  echo ");"
} > "$R/timing.ts"

# ---- scenes -------------------------------------------------------------------
for s in "${SCENES[@]}"; do
  P="$(pascal "$s")Scene"
  cat > "$R/scenes/$P.tsx" <<EOF
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Voice, useVisualsTheme} from '@harness/visuals';

// Scene "$s" of reel $REEL. Replace the placeholder with the storyboard's
// on-screen copy and visuals (components from @harness/visuals, client content as
// props). Colours, fonts and springs come from the client's visualsTheme.
export const $P: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {colors, fonts, springs} = useVisualsTheme();
	const enter = spring({fps, frame, config: springs.smooth});

	return (
		<AbsoluteFill style={{backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: '0 80px'}}>
			<div
				style={{
					fontFamily: fonts.display,
					fontSize: 80,
					fontWeight: 800,
					color: colors.foreground,
					textAlign: 'center',
					opacity: enter,
					transform: \`translateY(\${interpolate(enter, [0, 1], [30, 0])}px)\`,
				}}
			>
				TODO on-screen copy for "$s"
			</div>

			{/* Voiceover from ../script.md via scripts/voiceover.sh. Add \`subtitles\` (and \`subtitlesBottom\`)
			    only where the spoken line is NOT already on screen (22-craft-audio.md). */}
			<Voice scene="$s" />
		</AbsoluteFill>
	);
};
EOF
done

# ---- Reel.tsx -----------------------------------------------------------------
{
  echo "import React from 'react';"
  echo "import {TransitionSeries, linearTiming} from '@remotion/transitions';"
  echo "import {fade} from '@remotion/transitions/fade';"
  echo "import {VisualsThemeProvider, VoiceProvider} from '@harness/visuals';"
  echo "import {visualsTheme} from '../../brand/theme';"
  echo "import {SCENE_DURATION, TRANSITION} from './timing';"
  echo "import {VOICE} from './voice/generated';"
  for s in "${SCENES[@]}"; do P="$(pascal "$s")Scene"; echo "import {$P} from './scenes/$P';"; done
  echo
  echo "// Reel $REEL — one composition (Reel-$REEL). Music bed: once a licensed track has a"
  echo "// row in assets/music/LICENSES.md, add <MusicBed src={staticFile('audio/music/<file>')}"
  echo "// duckWindows={DUCK_WINDOWS} /> inside the VoiceProvider (22-craft-audio.md)."
  echo "export const Reel: React.FC = () => {"
  echo "	return ("
  echo "		<VisualsThemeProvider theme={visualsTheme}>"
  echo "			<VoiceProvider index={VOICE}>"
  echo "				<TransitionSeries>"
  for i in "${!SCENES[@]}"; do
    s="${SCENES[$i]}"; P="$(pascal "$s")Scene"
    [ "$i" -gt 0 ] && echo "					<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: TRANSITION})} />"
    echo "					<TransitionSeries.Sequence durationInFrames={$(access "$s")}>"
    echo "						<$P />"
    echo "					</TransitionSeries.Sequence>"
  done
  echo "				</TransitionSeries>"
  echo "			</VoiceProvider>"
  echo "		</VisualsThemeProvider>"
  echo "	);"
  echo "};"
} > "$R/Reel.tsx"

# ---- Root.tsx registration ----------------------------------------------------
ROOT="$DIR/src/Root.tsx"
if ! grep -q "reels/$REEL/Reel'" "$ROOT"; then
  last_import=$(grep -n '^import ' "$ROOT" | tail -1 | cut -d: -f1)
  grep -q "from './brand/theme'" "$ROOT" || sed -i "${last_import}a import {FPS, WIDTH, HEIGHT} from './brand/theme';" "$ROOT"
  last_import=$(grep -n '^import ' "$ROOT" | tail -1 | cut -d: -f1)
  sed -i "${last_import}a import {Reel as Reel${REEL_PASCAL}} from './reels/$REEL/Reel';\nimport {DURATION_FRAMES as D_${REEL_UPPER}} from './reels/$REEL/timing';" "$ROOT"
  grep -q '^[[:space:]]*</>' "$ROOT" || { echo "Root.tsx: no closing fragment (</>) to insert before — add the <Composition> by hand" >&2; }
  sed -i "0,/^[[:space:]]*<\/>/s##\t\t\t<Composition id=\"Reel-$REEL\" component={Reel${REEL_PASCAL}} durationInFrames={D_${REEL_UPPER}} fps={FPS} width={WIDTH} height={HEIGHT} />\n&#" "$ROOT"
fi

# ---- reel note stub -----------------------------------------------------------
NOTE="$DIR/agents/rules/reels/$REEL.md"
mkdir -p "$(dirname "$NOTE")"
[ -f "$NOTE" ] || cat > "$NOTE" <<EOF
# Reel $REEL (composition \`Reel-$REEL\`)

## Purpose
<!-- in the user's words: purpose, audience, the one message, target length, content line, assets, deadline -->

## Scenes
<!-- per scene: duration (frames/seconds), on-screen copy verbatim, visual, audio plan; every line checked against 20-legal.md -->
$(for s in "${SCENES[@]}"; do echo "- \`$s\` — "; done)

## Status: brief
EOF

cat <<EOF
Scaffolded src/reels/$REEL (scenes: ${SCENES[*]}) and registered Reel-$REEL in src/Root.tsx.
  next: 1. storyboard → on-screen copy into scenes/*.tsx, designed lengths into timing.ts
        2. spoken lines into src/reels/$REEL/script.md, then scripts/voiceover.sh $CLIENT $REEL
        3. scripts/verify.sh $CLIENT Reel-$REEL <frames>; scripts/render.sh $CLIENT Reel-$REEL
  note: agents/rules/reels/$REEL.md (fill Purpose and Scenes; run scripts/sync-agents.sh --client projects/$CLIENT)
EOF
