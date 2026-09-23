# @harness/pipeline

Audio tooling for client reels: voiceover, transcription for captions, and
mastering. Plain Node 22 ESM, no build step; runs from the harness root
through the wrapper scripts.

```
scripts/voiceover.sh <client> <reelId> [--voice <preset|provider/voiceId>] [--force] [--model small] [--no-transcribe] [--recaption]
scripts/voiceover.sh <client> <reelId> --list-voices
scripts/master.sh    <client> <in.mp4> [out.mp4]
scripts/music-placeholder.sh <client> [seconds]
npm test              # in packages/pipeline: parser, presets, loader
```

## The script: `src/reels/<reelId>/script.md`

A voiceover is written like a screenplay, not like configuration:

```markdown
# comments start with a single #
voice: narrator            # preset name; omit for the default preset
pause-before: 0.4          # seconds of silence before the first word of every scene (default 0.4)
pause-after: 0.7           # … after the last word (default 0.7)

## hook
Where does it come from?

## far
Twelve thousand kilometres [pause 0.4] halfway around the globe.
> subtitle: 12,000 km – halfway around the globe.

## region
voice: warm                # per-scene preset, must be the first line of the scene
From the region. *About fifty* kilometres.
Lines of prose are joined with spaces.
```

| Element | Meaning |
|---|---|
| `## sceneId` | one scene; ids match `[a-zA-Z0-9-]+`, unique, and are what `<Voice scene="…">` refers to |
| prose | the **spoken** form — what the voice says ("H zwei O zwei", "example Punkt d e") |
| `> subtitle: …` | the **written** form shown in captions where it differs ("H₂O₂", "example.de"); default = prose with markers stripped |
| `[pause N]` | N seconds of exact silence, provider-independent (segments are synthesised separately and joined with `anullsrc`); stripped from captions |
| `*words*` | emphasis: bold and accent in the captions for the whole page; passed to the voice only if the provider declares `supportsEmphasis` (none does today — stated plainly, no pretence of prosody) |
| front matter | only `voice`, `pause-before`, `pause-after`. Anything else is an error: provider settings belong in `voices.json` |

Errors name the line. **Code form:** where text is assembled from data, a
`script.ts` next to the reel may replace `script.md` (never both):

```ts
import {defineScript} from '@harness/pipeline/script';
export default defineScript({
	voice: 'narrator', pauseBefore: 0.4, pauseAfter: 0.7,
	scenes: {
		hook: 'Spoken text.',                                                   // string = spoken text
		far: {text: `${km} kilometres [pause 0.4] far away`, subtitle: '12,000 km – far away', voice: 'warm'},
	},
});
```

It is bundled with esbuild from the client's `node_modules` (`@remotion/bundler`
ships it) and validated exactly like the markdown. The client project declares
`"@harness/pipeline": "file:../../packages/pipeline"` for the types.

## Voice presets: `voices.json`

The script names a voice; a **preset** holds everything the pipeline needs.
Three layers, later ones extend or override earlier ones (per preset name):

| Layer | File | Holds |
|---|---|---|
| harness | `assets/voices/presets.json` | free local defaults (`default-de-male`, `default-de-female`); required |
| client | `src/brand/voices.json` | the client's voices — a brand decision, named in the client's `10-brand.md` |
| reel | `src/reels/<reelId>/voices.json` | extra or overriding voices for one reel (a second speaker, a test) |

```json
{
  "default": "narrator",
  "voices": {
    "narrator": {"provider": "piper", "voiceId": "de_DE-thorsten-high", "language": "de"},
    "warm": {"provider": "elevenlabs", "voiceId": "abc123", "language": "de",
             "model": "eleven_multilingual_v2", "settings": {"stability": 0.5, "similarity_boost": 0.8}}
  }
}
```

`settings` and `model` go to the adapter untouched (Piper: `lengthScale`,
`sentenceSilence`, `noiseScale`, `noiseW`, `speaker`; ElevenLabs:
`voice_settings`). The `default` of the most specific layer that sets one
wins. An unknown name fails with every known name and its layer.
`--voice provider/voiceId` on the CLI is an escape hatch for quick tests;
`--voice name` forces one preset for every scene.

## How a voiceover is produced

1. **Parse** `script.md` (or bundle and import `script.ts`), **resolve** every
   scene's preset through the three layers, fail early on unknown names.
2. **Synthesise** each `[pause]`-separated segment through the preset's
   provider (`voiceover/providers/<id>.mjs`, one file each, same interface
   `synthesize({text, voiceId, language, model?, settings?, outBase})`).
3. **Normalise** each segment: trim silence, single-pass loudnorm to speech
   level (−18 LUFS, −2 dBTP), 48 kHz mono 16-bit; **join** with exact silences
   → `public/audio/<reelId>/<scene>.wav`.
4. **Transcribe** with whisper.cpp (local, installed into
   `packages/pipeline/.whisper` on first run; model `small`) for word
   timestamps; **align** the caption text onto them by character position;
   mark emphasised words; **page** into caption cards (≤ 60 characters,
   breaks on gaps and sentence ends, numbers stay with units). The heard-vs-
   script diff is printed as `heard: …` — the pronunciation report.
5. **Write** `src/reels/<reelId>/voice/generated.ts` — data only, typed
   `satisfies VoiceIndex` from `@harness/visuals`.

Clips are cached by their recipe hash (`public/audio/<reelId>/.cache.json`:
provider, voice, language, model, settings, segments, pauses); only changed
scenes are re-synthesised. `--force` regenerates everything, `--recaption`
keeps the clips and redoes transcription and paging.

## Providers

| id | Runs | Key | Cloning | Emphasis | State |
|---|---|---|---|---|---|
| `piper` | local, offline, free (MIT) | none | no | no | default; binary and voices baked into the image (`assets/voices/piper-voices.txt`) |
| `elevenlabs` | cloud | `ELEVENLABS_API_KEY` | yes | no (REST body has no markup) | **untested** until a key exists |

A provider that needs a key fails loudly when the key is missing and names
the free fallback. It never falls back silently — a wrong voice in a
deliverable is worse than a failed render.

Adding a provider: copy `providers/elevenlabs.mjs`, implement `synthesize`,
set `supportsEmphasis` honestly, register it in `providers/index.mjs`, add a
row here and in `agents/rules/82-open-decisions.md` if it needs a licence check.

## Using the output in a reel

```ts
// timing.ts — scene = max(designed, pause + clip + pause); starts, total, duck windows
import {deriveVoiceTiming} from '@harness/visuals';
import {VOICE} from './voice/generated';
export const {VOICE_START, SCENE_DURATION, SCENE_START, DURATION_FRAMES, DUCK_WINDOWS} =
	deriveVoiceTiming(VOICE, {hook: 150, far: 180, cta: 150}, {fps: FPS, transition: 12});
```
```tsx
// Reel.tsx, once, inside the theme provider
<VoiceProvider index={VOICE}>
	<MusicBed src={staticFile('audio/music/<track>.m4a')} duckWindows={DUCK_WINDOWS} />
	<TransitionSeries>…</TransitionSeries>
</VoiceProvider>

// in a scene: the clip, and captions where the spoken line is not already on screen
<Voice scene="hook" />
<Voice scene="far" subtitles subtitlesBottom={720} />
```

Then `scripts/render.sh` and `scripts/master.sh` for the delivery loudness
(−14 LUFS integrated, ≤ −1 dBTP). Rules: `agents/rules/22-craft-audio.md`.
`scripts/check-client.sh` validates the presets and every reel's script
(`voiceover/check.mjs`).

## Music

Tracks need a licence row before use — `assets/music/LICENSES.md` (harness)
or the client's own copy. `scripts/music-placeholder.sh` generates a
rights-free test pad that is **not for delivery**.
