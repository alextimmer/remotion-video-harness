---
name: video-production
description: Use when a client asks for a new reel or a new version of one, when a reel moves from idea to rendered MP4, or when a delivered reel needs a change. The end-to-end workflow with checkpoints — brief, storyboard, build, voiceover, music, captions, render, verify, deliver — so nothing is claimed done before it has been rendered, looked at, listened to and checked against the client's legal list.
---

# Video production

## Overview

A reel is done when a rendered MP4 in `deliveries/` has passed the verify
phase, not when the code compiles. Each phase below ends with a checkpoint;
do not start the next without it. The user is the source of brand, claims and
taste; the craft rules (`agents/rules/2x-craft-*.md`) are the source of
technique; the visuals package is the source of components.

Preconditions, every time:
- `scripts/check-client.sh <client>` prints `READY`. If not → `onboarding-clients`.
- Read the client's `agents/rules/20-legal.md` and `10-brand.md`, and the
  harness `82-open-decisions.md` plus the client's `85-open-decisions.md`.
  Anything the reel needs that is listed there is **asked, not assumed**.

## Map: phase → command → checkpoint

| Phase | You run | Skill / rule to read | Done when |
|---|---|---|---|
| 0 Client ready | `scripts/check-client.sh <client>` | `onboarding-clients` if NOT READY | prints READY |
| 1 Brief | — (write `agents/rules/reels/<id>.md`) | this skill | user confirms purpose, length |
| 2 Storyboard | — (`## Scenes` in the note) | `20-legal.md` of the client, `21-craft-motion.md` | user approves copy and scenes |
| 3 Build | `scripts/new-reel.sh <client> <id> <scenes…>`, then edit scenes; `npx tsc --noEmit` in the project; `scripts/verify.sh` | `visuals-library`, `21-craft-motion.md` | stills of every scene look right |
| 4 Voiceover | write `src/reels/<id>/script.md`; `scripts/voiceover.sh <client> <id>` | `22-craft-audio.md`, `packages/pipeline/README.md` | clips fit, "heard:" lines understood |
| 5 Music | `scripts/music-placeholder.sh` (tests only); licensed track + `<MusicBed>` | `22-craft-audio.md`, `assets/music/LICENSES.md` | licence row exists |
| 6 Subtitles | `<Voice scene subtitles />` where needed | `22-craft-audio.md` | stills at subtitle changes |
| 7 Render | `scripts/render.sh <client> Reel-<id>` | — | frame count = `DURATION_FRAMES` |
| 8 Verify | `scripts/verify.sh <client> Reel-<id> <frames…>`; `reviewer` subagent; `scripts/master.sh <client> out/Reel-<id>.mp4` | `20-craft-reels.md`, `23-craft-legal-food.md` | user watches and approves |
| 9 Deliver | copy to `deliveries/`; `scripts/sync-agents.sh --client`; commit locally | this skill | note says delivered; never pushed |

## Phases

### 1. Brief
Capture, in the user's words: purpose, audience, the one message, target
length, content line (new or a version of an existing reel), assets on hand,
deadline. Write `agents/rules/reels/<id>.md` with `## Purpose` and
`## Status: brief`. Composition id `Reel-<id>`; ids use dashes, not dots.
*Checkpoint:* user confirms purpose and length.

### 2. Storyboard
Scenes with duration in frames and seconds, the on-screen text per scene
(verbatim — this is the copy), the visual per scene, and the audio plan
(voice lines, music mood, SFX beats). Every text line is checked against
`20-legal.md`; unknown claims go to the legal owner first. Match visuals to
`packages/visuals/INDEX.md` (skill `visuals-library`); mark what is new.
Hold times follow `21-craft-motion.md` ("readable twice"). Record the
storyboard in the reel note under `## Scenes`.
*Checkpoint:* user approves copy and scene list. Copy changes after this are
a new legal check.

### 3. Build
Scaffold with `scripts/new-reel.sh <client> <id> <sceneId…>`: it writes
`src/reels/<id>/` with `Reel.tsx` (theme provider, voice provider, fades),
`timing.ts` (`deriveVoiceTiming` over the designed lengths — edit those),
`script.md` (one heading per scene), a placeholder `voice/generated.ts`,
one scene file per id with a `<Voice>` line, the `<Composition>` in
`Root.tsx` and the reel note stub. Then fill the scenes: on-screen copy
from the storyboard as JSX, components from `@harness/visuals` with client
content as props; client-only drawings in `src/brand/components/`. Build brand-independent structure first if
brand decisions are still open.
*Checkpoint:* `npx tsc --noEmit` clean; `scripts/verify.sh` stills at one
frame per scene look right (phase 7 criteria) before any audio work.

### 4. Voiceover
Write `src/reels/<id>/script.md` — the screenplay: front matter `voice:`
(a preset name), `pause-before:`, `pause-after:`; then one `## sceneId`
heading per scene with the spoken line as prose (approved on-screen copy or
its literal expansion), `> subtitle:` where the written form differs,
`[pause N]` for a beat, `*emphasis*` for stress (`22-craft-audio.md`). Use
`script.ts` with `defineScript()` only when the text is assembled from data.
Voices are **presets**: the client's in `src/brand/voices.json` (a brand
decision — `10-brand.md`, open-decisions register), one reel's extras in
`src/reels/<id>/voices.json`, the free local defaults in the harness
`assets/voices/presets.json`. Provider settings never go into the script.
A draft always works with a free preset (no key); the client's chosen voice
replaces it before delivery. Run `scripts/voiceover.sh <client> <id>`: it
synthesises each segment, joins the pauses, normalises, transcribes for word
timestamps, aligns captions to the script and writes `voice/generated.ts`
(data — never edit). Read its "heard:" lines — they are the pronunciation
report; fix wording in `script.md` or add a pronunciation to the client's
list. Wire the reel: `<VoiceProvider index={VOICE}>` in `Reel.tsx`,
`<Voice scene="…" />` in each scene, `deriveVoiceTiming(VOICE, designed,
{fps, transition})` in `timing.ts` so scene length = max(designed, voice);
never speed speech up.
*Checkpoint:* every clip fits its scene with padding; the heard text matches
the script or the differences are understood.

### 5. Music
One licensed bed (`assets/music/LICENSES.md` row first) via `<MusicBed>` from
`@harness/visuals`, ducked under the speech windows from the voice index,
fading with the CTA. For pipeline tests only, `scripts/music-placeholder.sh`
generates a rights-free pad that never ships. SFX only on the storyboard's
beats.
*Checkpoint:* the bed has a licence row; ducking audible in a render.

### 6. Captions
Subtitles are the transcript of the voice for muted viewers — not the
scene's on-screen copy, which stays in the `.tsx`. `<Voice scene="…"
subtitles />` (optionally `subtitlesBottom={720}` where the scene draws in
the default band) — burnt in, ≤ 2 lines, above the UI zone, themed, current
word in the accent, `*emphasised*` words bold. Omit `subtitles` where the
spoken line is already the scene's on-screen text, and then leave the
`> subtitle:` line out of the script too.
*Checkpoint:* stills at caption changes; umlauts and ß render; no page overflows.

### 7. Render
`scripts/render.sh <client> Reel-<id>` — headless, never Studio for
deliverables. The script clears a stale bundle cache when the visuals
package changed. Note the frame count and size.

### 8. Verify
This phase is mandatory and is where most fixes happen.
- `scripts/verify.sh <client> Reel-<id> <frames>` at: each scene's entrance
  mid-point, hold, exit; each caption change; the CTA.
- **Look at every still** (or hand them to the `reviewer` subagent). Check:
  text overflow at the longest word, safe zones, contrast, layer order,
  emoji, system-font fallback, unthemed defaults (blue accent), implied
  visual claims.
- `scripts/master.sh <client> out/Reel-<id>.mp4` → `.mastered.mp4` at −14 LUFS
  integrated, ≤ −1 dBTP; it refuses a silent file. Deliver the mastered file.
- Frame count equals `DURATION_FRAMES`; the tail is not frozen or black.
- Legal: every on-screen statement and every implied visual claim has an
  "allowed" row in `20-legal.md`.
Fix → re-render → re-verify. Only then:
*Checkpoint:* user watches the MP4 and approves.

### 9. Deliver
Copy the approved MP4 to `deliveries/<id>__<descriptive>.mp4` (git-ignored,
never versioned). Update the reel note: `## Status: delivered <date>`,
renders listed, claims cleared. Log in the client's `80-memory-decisions.md`
/ `90-memory-sessions.md`; new reusable visual → `visuals-library` storing
steps; new gotcha → harness learnings. `scripts/sync-agents.sh --client`.
Commit locally; tag if the user wants a version marker. **Never push** — the
user publishes repositories whole.

## Iterating on an existing reel

Copy, don't mutate: a new version is a new `src/reels/<id>/` and a new
composition, the previous one stays renderable (that is why seven versions
of one client's reels are live compositions today). Reuse scenes by import
where they are identical; fork where they differ.

## Red flags — stop

- "It compiles, so it's done." — Nothing is done before phase 8.
- "I'll use the default colours for now." — Unthemed output never leaves.
- "The claim is soft enough." — Not your call; `20-legal.md` or the legal owner.
- "The voice/music can be decided later." — They are in the open-decisions
  register; ask, build the rest meanwhile.
- "Speed up the voice slightly to fit." — Extend the scene instead.
- "Pushing so the client can see it." — Deliver the MP4; never push.
