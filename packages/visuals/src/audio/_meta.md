# Visual: Audio — voice playback, voice-derived timing, music bed

## Description
The scene side of the voiceover pipeline. `<VoiceProvider index={VOICE}>` once per reel, `<Voice scene="id" />` once per scene (clip after the script's pause-before, optional subtitles), `deriveVoiceTiming()` for scene lengths that follow the voice, and `<MusicBed>` for a looping bed ducked under speech and faded at both ends. Volume is a pure function of the frame, so the mix is identical in Studio and render.

## Keywords
voiceover, voice index, script, scene timing, duck windows, music, bed, ducking, sidechain, volume automation, fade, loop, audio mix, deterministic

## Research and key prompts
- Authoring lives in `src/reels/<id>/script.md` (screenplay markdown: `## sceneId`, prose, `> subtitle:`, `[pause N]`, `*emphasis*`); `scripts/voiceover.sh` writes `voice/generated.ts`. The generated file is data only and typed `satisfies VoiceIndex` (type here, in `voice-types.ts`), so it never looks like code to edit. The old per-scene `Sequence`/`Audio`/`staticFile`/`Captions` boilerplate and the per-reel timing arithmetic were the same thirty lines in every reel — they moved here.
- Scene length follows the voice, never the reverse: `deriveVoiceTiming` takes the **designed** lengths and returns `max(designed, pause + clip + pause)` per scene, scene starts (minus transition overlaps), the total length and the speech windows for ducking. Pure, hook-free, so Root.tsx can read `DURATION_FRAMES` statically.
- Ducking inside Remotion (volume as `f(frame)`) instead of an ffmpeg sidechain keeps one render and lets the mix be previewed; final loudness is set afterwards with `scripts/master.sh`.
- 8–12 dB under the voice is the range that reads as "music behind speech" — as linear gains, duck to ~0.25–0.4 of the bed level. Ramps of ~300 ms breathe; shorter pumps, longer smears the speech onset.
- `<Voice>` throws with the list of known scene ids when a scene is missing from the index (a typo in `scene=`, or the script has no `## heading` for it) — a silent scene would otherwise pass every check but the ear.

## Technical approach
- `Voice.tsx`: React context carries the `VoiceIndex`; `<Voice>` renders `<Sequence from={voiceStart} layout="none"><Audio src={staticFile(file)}/></Sequence>` and, with `subtitles`, `<Captions pages offsetFrames={voiceStart} bottom …/>`.
- `timing.ts`: `deriveVoiceTiming(index, designed, {fps, transition})`; scene order is the key order of `designed`; `transition` is one overlap for all or a partial record keyed by the **preceding** scene; scenes without a clip keep their designed length and get no duck window.
- `MusicBed.tsx`: for each duck window, `interpolate` gives 1 → 0 → 1 with `rampMs` shoulders; the minimum over windows scales between `duckVolume` and `bedVolume`; fade-in/out multiply on top. Uses `remotion`'s `<Audio volume={fn} loop>`.

## Style adaptation
`<Voice>` passes `theme` through to the captions. `MusicBed` is not themed — gains and ramps only. Track choice and licence are the client's (`assets/music/LICENSES.md`).

## Props
- `VoiceProvider`: `index` (the generated `VOICE`).
- `Voice`: `scene`, `subtitles?`, `subtitlesBottom?`, `subtitlesFontSize?`, `subtitlesMaxWidth?`, `volume?`, `theme?`.
- `deriveVoiceTiming(index, designed, {fps, transition})` → `{VOICE_START, SCENE_DURATION, SCENE_START, DURATION_FRAMES, DUCK_WINDOWS}`.
- `MusicBed`: `src`, `duckWindows?` (composition-relative ms), `bedVolume?`, `duckVolume?`, `rampMs?`, `fadeInMs?`, `fadeOutMs?`, `startFromFrames?`, `loop?`.

## Data dependencies
`src/reels/<id>/voice/generated.ts`, written by `packages/pipeline/voiceover` from the reel's `script.md` (or `script.ts`) and the voice presets (`assets/voices/presets.json` → client `src/brand/voices.json` → reel `voices.json`).
