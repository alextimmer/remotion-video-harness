# Craft: audio and captions

Holds for every client. The default deliverable carries audio (a voice, a
music bed, or both) and every spoken word is also on screen. A silent or
voice-only reel is not a failure when the user has decided it for that reel
or client — record the decision in the reel note or the client's register and
skip the music phase; `scripts/master.sh` still applies to anything with a
voice. Levels below are common platform-oriented targets; measure, do not
guess, and check the platform's current guidance when it matters.

## Levels

- Deliverable loudness: **−14 LUFS integrated**, **true peak ≤ −1 dBTP**.
  Streaming platforms normalise around this; louder gains nothing and clips.
- Voiceover: −16 to −18 LUFS short-term, consistent across scenes. Normalise
  each scene's clip before placing it.
- Music under speech: ducked **8–12 dB** below the voice, attack/release
  200–400 ms so the bed breathes rather than pumps. Music alone (intro, CTA
  tail): −20 to −24 LUFS.
- Sound effects: sparse, only on key beats (stamp, reveal, count landing),
  peaks ~6 dB under the voice. No whooshes on every entrance.
- 48 kHz throughout. Measure with `ffmpeg -af ebur128` (or `loudnorm` in
  two-pass mode) before delivery and keep the report with the render.

## Voiceover

- Written as a **script**, `src/reels/<id>/script.md`, from copy that is
  already cleared (`20-legal.md` of the client): one `## sceneId` heading per
  scene, the spoken line as prose. The script is text in the reel note first.
- Scene length follows the voice, never the other way round: **do not speed
  up speech to fit**; `deriveVoiceTiming()` in `timing.ts` extends every scene
  to `max(designed, pause + clip + pause)` from the generated voice index.
- Padding: 0.3–0.5 s of silence before the first word of a scene, ≥ 0.5 s
  after the last (`pause-before` / `pause-after` in the script, defaults 0.4
  and 0.7); a `[pause N]` marker inside a line for a breath or a beat.
- Pronunciation of product names, abbreviations and formulas is a client
  decision (client open-decisions register); keep a pronunciation list with
  the voice choice in the client's `10-brand.md`.
- Timing truth comes from transcription of the rendered clip (word
  timestamps), not from the TTS provider's estimate. Caption **text** is the
  approved script, aligned onto those timings — never the raw recognition.
- Tooling: `scripts/voiceover.sh <client> <reelId>` (script → clips +
  `voice/generated.ts`), `scripts/master.sh` for the delivery loudness,
  `scripts/music-placeholder.sh` for a rights-free test bed. Providers are
  plugins; the free local Piper voice needs no key (`packages/pipeline/README.md`).

## The script (`src/reels/<id>/script.md`)

```markdown
voice: narrator            # preset name (src/brand/voices.json); omit for the default
pause-before: 0.4          # seconds of silence before the first word of every scene
pause-after: 0.7

## hook
Where does it come from?

## far
Twelve thousand kilometres [pause 0.4] halfway around the globe.
> subtitle: 12,000 km – halfway around the globe.

## region
voice: warm                # per-scene preset override, first line of the scene
From the region. *About fifty* kilometres.
```

- One source per reel: `script.md`, or `script.ts` with `defineScript()` from
  `@harness/pipeline/script` for text assembled from data. Never both.
- **Voices are presets, never provider settings in the script.** Presets
  live in JSON: harness `assets/voices/presets.json` (free defaults) →
  client `src/brand/voices.json` (the client's voices — a brand decision,
  named in `10-brand.md`) → optional `src/reels/<id>/voices.json` (an extra
  speaker for one reel). The script names a preset; provider, voice id,
  language, model and settings sit in the preset.
- `[pause N]`: N seconds of exact silence, provider-independent (segments are
  synthesised separately and joined). Stripped from captions.
- `*emphasis*`: the words render bold and in the accent in the captions for
  the page's whole life. The voice receives the marker only from a provider
  that declares emphasis support — none of the current ones do, so spoken
  emphasis is **not** produced today; the script still says the same thing
  on every provider, and the caption carries the stress.
- `> subtitle:` is the written form of the **subtitle** where it differs
  from the spoken one; otherwise the subtitle is the prose with markers
  stripped. It has no effect in a scene without `subtitles`, so leave it out
  there. It is not the scene's on-screen copy (that stays in the `.tsx`).
- Scene side: `<VoiceProvider index={VOICE}>` once in `Reel.tsx`,
  `<Voice scene="far" />` (or `… subtitles subtitlesBottom={720}`) per scene,
  `deriveVoiceTiming(VOICE, designed, {fps, transition})` in `timing.ts` — all
  from `@harness/visuals`. `voice/generated.ts` is data; never edit it.

## Music

- One bed per reel, chosen for the content line, ending with the CTA; fade
  out 1–2 s, never a hard cut.
- No vocals under voiceover.
- Licence recorded in `assets/music/LICENSES.md`: file, source, licence,
  what it permits (paid social advertising must be covered), date obtained.
  A track without that row is not used.

## Subtitles (burnt-in captions)

- **Two different texts.** The scene's on-screen copy (headlines, labels,
  the CTA) lives in the scene's `.tsx` and is written in the storyboard.
  A subtitle is the transcript of the voice for muted viewers, shown on a
  plate only where a scene asks for it (`<Voice scene subtitles />`). The
  script never changes what a scene draws.
- Burnt in. Many viewers watch muted; the spoken message must survive that.
- **Omit the caption where the spoken line is already the on-screen text** of
  the scene (a hook headline, a CTA with URL and hashtag). It would duplicate
  the headline and collide with the layout; the scene itself serves muted
  viewers there.
- Written form on screen, spoken form in the ear: the script's prose is what
  the voice says ("H zwei O zwei", "example Punkt d e"); a `> subtitle:` line
  gives what the caption shows where it differs ("H₂O₂", "example.de").
- Place per scene: the default band (`bottom` 470) must be free of scene
  content; where the scene draws there, pass `subtitlesBottom`. Captions
  render above everything (`zIndex`).
- ≤ 2 lines (pages of ≈ 60 characters wrap into two), body size ≥ 40 px, inside the safe
  zones (`20-craft-reels.md`), high contrast on a soft plate if the
  background is busy.
- Timed from transcription word timestamps; a caption appears with its first
  word and leaves with the scene's last word or the next caption.
- Check umlauts, ß and special characters in the loaded font on a still.
- Style comes from the theme (`fonts.body`, `foreground`, `background` plate);
  the caption component belongs in the visuals package once built.

## Verification before delivery

1. `ffmpeg -i out/<reel>.mp4 -af ebur128 -f null -` — integrated LUFS and
   true peak within target.
2. Stills at caption changes: overflow, safe zones, contrast.
3. Listen once at phone speaker volume: speech intelligible over the bed,
   no clipping on the stamp/SFX beats, music ends with the picture.
