# Harness decisions

## 2026-03-31: Devcontainer architecture [Claude Code]
- Docker devcontainer with Node 22 (bookworm-slim) because there is no Node.js on Windows.
- Chrome Headless Shell pre-installed in the Dockerfile via `npm install -g @remotion/cli && npx remotion browser ensure`.
- `post-create.sh` installs npm dependencies for all project folders and downloads the Remotion skills.
- Port 3000 forwarded for Remotion Studio; `Config.setIPv4(true)` required.

## 2026-03-31: Project structure [Claude Code]
- Templates in `templates/` (insta-reel, landscape-1080p, square); `new-project.sh` bootstraps from a template.

## 2026-09-18: Harness / content architecture [Claude Code]
- Summary:
- Harness (tooling, skills, visuals, pipeline) is separated from client content. One repository per client, one composition per reel.
- Three knowledge layers (harness / client / user) with a routing rule; memory files live in the repository of their layer.
- Agent-agnostic: rules in `agents/rules/`, generated `AGENTS.md`, skills in `.agents/skills/`, `CLAUDE.md` contains only `@AGENTS.md`. Claude-specific files are adapters. The Copilot instructions file was removed.
- Visuals stay inside the harness as a `file:`-linked npm package (spike first). Final MP4s are git-ignored, no Git LFS. The project manifest is git-ignored with a committed example.
- All existing reels migrated into the client repository as tagged commits; remotes are chosen after the refactor; nothing is pushed before a repository is done.
- Git branches: `heritage` keeps the pre-restructuring state, work happens on `restructure`, `main` receives it when done.

## 2026-09-21: Visuals as a linked package [Claude Code]
- Phase 0 spike passed: `packages/visuals` (`@harness/visuals`, peer dependencies only, `main: src/index.ts`) linked into `templates/insta-reel` via `file:../../packages/visuals`, `StaggeredWords` imported and rendered. The `tsconfig` paths + webpack alias fallback is not needed.
- The package keeps no `node_modules`; React and Remotion come from the consuming project. Consumers set `preserveSymlinks` (TypeScript) and `resolve.symlinks: false` (webpack) — see rule 30.
- `text-effects` moved first; the rest of `visuals/` follows in Phase 6.
- One shared Chrome Headless Shell in the image at `/opt/remotion-browser`, wired through `REMOTION_CHROME` and `Config.setBrowserExecutable()`, replacing the per-project 220 MB downloads.

## 2026-09-21: Visuals theme contract (Phase 6, step 1) [Claude Code]
- `packages/visuals/src/theme.ts` defines `VisualsTheme`: nine colour **roles** (`accent`, `accentLight`, `accentDark`, `foreground`, `foregroundSoft`, `muted`, `subtle`, `surface`, `background`), two fonts (`display`, `body`) and five spring presets (`smooth`, `gentle`, `bouncy`, `heavy`, `stamp`). Chosen from a census of every token the existing visuals actually use; role names keep brand vocabulary out of the package.
- Delivery is a React context — `<VisualsThemeProvider theme={…}>` once per reel — plus an optional partial `theme` prop on every component for one-off overrides (`useVisualsTheme(override)`). The original plan said "a `theme` prop on every component"; the provider satisfies the intent without a prop on ~40 call sites. Single React is guaranteed by Remotion's bundler aliases, so the context is safe through the `file:` link.
- Defaults are deliberately nobody's brand (blue accent on dark grey, `sans-serif`) so components render in isolation but never ship unthemed.
- Springs are typed `Partial<SpringConfig>`: Remotion's `SpringConfig` is the fully resolved shape, `spring()` accepts the partial.
- A client fulfils the contract in `src/brand/theme.ts` by mapping its own tokens onto the roles (`visualsTheme`); its brand names stay in Layer B.

## 2026-09-21: Visuals package complete (Phase 6) [Claude Code]
- The old `visuals/` folder is gone. All fourteen components live in `packages/visuals/src/` under technique-based folder and component names: `backgrounds/` (`HexScrollBackground`, `HexGrid`, `FloatingParticles`), `icons/` (`ShieldIcon`, `CheckmarkIcon`, `DropIcon`, `ThermometerIcon`, `MinimalIcon`), `price-balance-badge/`, `counterfeit-label-jar/`, `germany-delivery-map/`, `globe-flight-path/`, `lab-certificate-reveal/`, `falling-coins-counter/`, plus `text-effects/`. `packages/visuals/INDEX.md` is the lookup table.
- Source of truth for the port was the client's `src/shared/` (verified frame by frame in Phase 5), not the stale harness copies; the harness copies contributed only the neutral prop names Phase 3 had introduced. Both prop sets were merged.
- Every colour, font and spring goes through `useVisualsTheme()`; every client-facing text or value is a prop with a neutral default (`leftLabel`, `fakeLabel`, `destination`, `highlightState`, `from`/`to`, `sealText`, `targetPrice`, …). Component defaults that referenced the theme moved into the body (`color: colorProp` → `colorProp ?? colors.accent`) because hooks run after the parameter list.
- Geometry stays as typed `.ts` modules under `data/`, LF-normalised, with source and license in the header: Germany borders from `@svg-maps/germany` (CC BY 4.0, attributed), coastlines hand-placed by an agent (no external dataset, stated plainly — user decision 2026-09-21 to keep rather than replace with Natural Earth).
- The client passes its own strings at ~40 call sites and keeps client geography in `src/shared/geo.ts`; client-only visuals (the seal) stay in `src/brand/components/`. The leak gate over the harness is clean for the first time.
- `render.sh` and `verify.sh` clear Remotion's bundle cache once whenever `packages/` is newer than a per-project stamp — see learnings for why.

## 2026-09-21: Audio pipeline (Phase 8) [Claude Code]
- **Providers are plugins, chosen per reel.** `packages/pipeline/voiceover/providers/<id>.mjs` implements one function, `synthesize({text, voiceId, language, outBase})`; the voice spec is `provider/voiceId` and is resolved per scene: reel `voice.json` → client voice → harness default. Everything after synthesis (normalising, measuring, transcribing, paging) is shared.
- **Free local default, no key.** Piper (MIT) is baked into the image with the voices listed in `assets/voices/piper-voices.txt`; `PIPER_BIN`/`PIPER_VOICES` point at it. A draft voiceover always works. `elevenlabs` ships untested until a key exists. A missing key fails loudly and names the free fallback — never a silent swap.
- **Captions show the script, timed by the recogniser.** whisper.cpp (`@remotion/install-whisper-cpp`, model `small`, installed into `packages/pipeline/.whisper` on first run) gives word timestamps; the approved text is aligned onto them by character position. Spoken and written forms are separate fields (`text`, `subtitle`). The heard-vs-script diff is printed as a pronunciation report.
- **Scene length follows the voice, statically.** The pipeline writes `src/reels/<id>/voice/index.ts`; `timing.ts` derives `SCENE_DURATION = max(designed, voiceFrames())`, `SCENE_START` and `DUCK_WINDOWS` from it. No `calculateMetadata`: Studio and render agree, no async.
- **Music ducking inside Remotion, loudness outside.** `MusicBed` sets volume as a function of the frame (ducked under the speech windows, faded at both ends) so the mix is deterministic and previewable; `scripts/master.sh` then runs two-pass loudnorm to −14 LUFS / −1 dBTP and refuses a silent file.
- **No caption where the spoken line is the on-screen text** (hook headline, CTA). Captions render above everything and are placed per scene.
- Generated clips are committed with the reel (`public/audio/<id>/`), so a delivered reel stays reproducible if a provider disappears; the whisper build and model are not.
- Proof: reel v2.2 of the first client — v2.1 plus voice, captions and a placeholder bed — renders at 861 frames, masters to −14.0 LUFS, and passed the stills review. Voice, pronunciations and music remain the user's open decisions; nothing voiced is delivered before that.

## 2026-09-22: Voiceover authoring is a script, voices are presets [Claude Code]
- **Authoring in screenplay markdown**, `src/reels/<id>/script.md`: front matter (`voice`, `pause-before`, `pause-after`), one `## sceneId` per scene, the spoken line as prose, `> subtitle:` for the written form, `[pause N]` and `*emphasis*` markers. Decided with the user: a JSON manifest was the wrong interface for creative text, and the generated TypeScript looked like something to edit. `script.ts` with `defineScript()` (`@harness/pipeline/script`, bundled by esbuild from the client's node_modules) is the escape hatch for text assembled from data; one source per reel.
- **Provider configuration never enters the script.** A voice is a named **preset** in JSON, three layers with later ones overriding per name: harness `assets/voices/presets.json` (free defaults), client `src/brand/voices.json` (a brand decision — the one JSON exception to "brand values in theme.ts", because the Node pipeline reads it without a TypeScript loader), reel `src/reels/<id>/voices.json` (a second speaker for one reel). Unknown names fail listing every known preset with its layer.
- **Markers are honest.** `[pause N]` is provider-independent: segments are synthesised separately, normalised, and joined with exact `anullsrc` silence. `*emphasis*` always styles the caption (bold + accent for the page's life); the voice receives it only from an adapter that declares `supportsEmphasis` — none does today, and the docs say so rather than pretending prosody control.
- **The scene side lives in the package.** `<VoiceProvider index={VOICE}>`, `<Voice scene subtitles subtitlesBottom/>`, `deriveVoiceTiming(index, designed, {fps, transition})` and the `VoiceIndex` type are in `@harness/visuals`; the generated `voice/generated.ts` is data only (`satisfies VoiceIndex`). Thirty lines of per-reel timing arithmetic and five lines of per-scene boilerplate became one call and one tag.
- The client gate validates presets and every reel's script through the pipeline's own `check.mjs`, so the CLI and the gate agree on what is valid; retired `voice.json` / `voice/index.ts` files fail the gate.

## 2026-09-22: Subtitles, not captions; reels are scaffolded [Claude Code]
- The written form in a script is `> subtitle:` and `<Voice>` takes `subtitles` / `subtitlesBottom`: a subtitle is the voice's transcript for muted viewers, shown only where a scene asks for it; the scene's on-screen copy stays in its `.tsx`. A script for a reel without subtitles carries no `> subtitle:` lines. The `Captions` component keeps its name; `> caption:` in a script is an error that names the new marker.
- `scripts/new-reel.sh <client> <reelId> [sceneId…]` scaffolds what the production skill's build phase needs — `Reel.tsx` (theme + voice provider, fades), `timing.ts` (`deriveVoiceTiming` over designed lengths), `script.md` with the scene headings, a placeholder `voice/generated.ts`, one themed scene per id with its `<Voice>` line, the `<Composition>` in `Root.tsx`, the reel note stub — so the wiring is code in the harness, not something each session re-derives from the docs. Nothing brand-specific is chosen: scenes draw from `useVisualsTheme()`.

## 2026-09-23: Claude Code hooks enforce the checkable rules [Claude Code]
- Skills carry judgment; hooks carry enforcement. Seven hooks in `.claude/settings.json` → `.claude/hooks/*.mjs`: `deny-push` (PreToolUse Bash: git push, git remote add/set-url, gh repo create), `leak-gate-write` (PreToolUse Edit|Write outside `projects/`: `scripts/leak-gate.sh --stdin`), `client-gate` (PreToolUse Bash: `check-client.sh` before render/verify/voiceover/new-reel/master/start-studio), `check-render` (PostToolUse Bash after `render.sh`: `scripts/check-render.sh` → frames, audio, loudness, black tail as context), `sync-agents` (PostToolUse Edit|Write of `agents/rules/*.md`: regenerate the layer's AGENTS.md), `session-start` (state of both repos, gate, open-decision registers, last session entry), `memory-reminder` (Stop; ported from the inline bash hook).
- Every hook only calls a script under `scripts/` that any agent can run by hand, so the harness stays agent-agnostic: Codex or Copilot get the same checks through the rules, Claude gets them enforced. Hooks live under `.claude/` like the reviewer adapter.
- The leak-gate word list is Layer C (`.leakwords`, git-ignored, example committed) because the list itself is client data; the gate warns and passes when the list is missing.
- Not adopted: prompt/agent-type hooks (a model call per tool use), blocking edits on legal phrases (the gate warns instead), hooks that replace the skills' judgment.
- Second batch the same day: `protect-deliveries` and `commit-hygiene` (blocking), `visuals-index` (INDEX.md injected before a new component file; storing-protocol check after a package edit), `typecheck` (async, wakes on failure, one run per project at a time), `heard-report` (pronunciation lines after voiceover.sh), `stills-reminder` (Stop: reels edited in the last 24 h without a newer still), `precompact-memory` (PreCompact: write the logs first). Fourteen hooks in total.

## 2026-09-23: Publishing the harness with a fresh history [Claude Code]
- The harness history began with the client's content (baseline commit, 184 files) and carried client words for twelve more commits until Phase 6. Publishing that history would break the layer rule, and rewriting words out of commits cannot remove whole reels. Decision with the user: the public `main` is a single orphan commit of the clean tree, tagged `v0.6.0`; the full history stays local on `private/history` (the old `restructure`), `private/baseline` (the old `main`) and `private/heritage`, which are never pushed. The old tags `v0.1.0`–`v0.5.1` point into private history and stay local; the session logs record every phase.
- `docs/research.md` was dropped: this decisions log records where each adopted external idea lives.
- The client repository is published as it is (private); it gained a README stating that it only installs inside the harness checkout.
