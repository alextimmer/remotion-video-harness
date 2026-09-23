# Toolchain and workspace layout

Videos are made with Remotion (React) inside a Docker devcontainer. There is no
Node.js on the Windows host; every `npm`/`npx` command runs inside the container.

## Layout

```
harness root            this repository (Layer A)
  agents/rules/         rule files, source of the generated AGENTS.md
  .agents/skills/       official Remotion Agent Skills, installed by post-create (not tracked, never edited),
                        plus harness-authored skills (tracked): onboarding-clients, visuals-library, video-production
  .claude/agents/       Claude Code subagent adapters: reviewer (inspects verification stills, reports)
  .claude/hooks/        Claude Code hook adapters (.claude/settings.json), each wrapping a script any agent can run by hand:
                        deny-push, protect-deliveries, client-gate, commit-hygiene (PreToolUse Bash); leak-gate-write,
                        visuals-index (PreToolUse Edit/Write); check-render, heard-report (PostToolUse Bash); sync-agents,
                        visuals-index meta check, typecheck (async) (PostToolUse Edit/Write); session-start; precompact-memory;
                        memory-reminder and stills-reminder (Stop).
  .leakwords            client words for the leak gate (git-ignored, Layer C; .leakwords.example committed)
  skills-lock.json      written by `npx remotion skills add`; pins the installed official skills (tracked)
  .claude/skills        symlink to .agents/skills for Claude Code (created by post-create)
  templates/            insta-reel (1080x1920), landscape-1080p, square; client-repo skeleton
  packages/visuals/     @harness/visuals: the linked npm package of shared, themed animation components,
                        with INDEX.md (lookup table), src/theme.ts (theme contract) and per-visual _meta.md
  packages/pipeline/    @harness/pipeline: voiceover (script.md parser, voice presets, provider plugins, whisper captions),
                        mastering; `@harness/pipeline/script` = defineScript() for code-declared scripts; .whisper/ is a git-ignored build
  assets/voices/        presets.json — free default voice presets;  piper-voices.txt — Piper voices baked into the image;
                        assets/music/  licensed beds + LICENSES.md
  scripts/              sync-agents.sh, render.sh, verify.sh, upgrade.sh, clone-project.sh, check-client.sh,
                        new-project.sh (client repo from skeleton + format template), start-studio.sh (preview),
                        voiceover.sh, master.sh, music-placeholder.sh (audio pipeline)
  docker-compose.yml    render / verify / shell services for use without VS Code
  projects.yaml         local manifest of client repos (git-ignored; projects.example.yaml committed)
  README.md, HOWTO.md   overview with the "when to run what" map; step-by-step guide for the user
  projects/<client>/    client repositories (Layer B), independent git repos, git-ignored here
```

Client projects are standard Remotion projects: `package.json` (with
`harnessVersion`), `src/`, `public/`, `remotion.config.ts`, one
`<Composition>` per reel in `src/Root.tsx`, brand values in `src/brand/theme.ts`.

## Commands (inside the container, from the harness root)

- `scripts/new-project.sh <client> [format]` — new client repository; then onboard it (rule 40)
- `scripts/check-client.sh <client>` — readiness gate, must print READY before reel work
- `scripts/new-reel.sh <client> <reelId> [sceneId…]` — scaffold a reel: `Reel.tsx`, `timing.ts` (`deriveVoiceTiming`), `script.md`, placeholder `voice/generated.ts`, one scene file per id, `<Composition>` in `Root.tsx`, reel note stub
- `scripts/render.sh <client> <CompositionId> [name]` — headless render to `projects/<client>/out/`, no Studio
- `scripts/verify.sh <client> <CompositionId> <frame...>` — stills to `out/verify/` for visual checks; look at them before claiming done
- `scripts/start-studio.sh <client>` — Studio preview on localhost:3000 (optional)
- `scripts/voiceover.sh <client> <reelId> [--voice <preset|provider/id>]` — TTS per scene from `src/reels/<id>/script.md`, exact pauses, captions, generated `voice/generated.ts`; voices are presets (`assets/voices/presets.json` → client `src/brand/voices.json` → reel `voices.json`); free local Piper default, no key
- `scripts/master.sh <client> <in.mp4>` — two-pass loudnorm to −14 LUFS / −1 dBTP with an ebur128 report; fails on a silent file
- `scripts/music-placeholder.sh <client>` — rights-free test bed, never for delivery
- `scripts/sync-agents.sh [--client <dir>]` — regenerate AGENTS.md after editing rules (the Claude hook does this automatically)
- `scripts/leak-gate.sh [--staged | --stdin <label> | <file>…]` — client words in harness files; word list in `.leakwords`
- `scripts/check-render.sh <client> <mp4>` — frames, audio and loudness, black-tail check of a render (the Claude hook runs it after every render.sh)
- `scripts/upgrade.sh [version]` — pin Remotion everywhere, update skills; then rebuild the container
- Without VS Code: `docker compose run --rm render <client> <CompositionId>`

## Container facts

- Node 22, Debian bookworm, system FFmpeg (audio pipeline) plus the one bundled with Remotion, `ca-certificates` (the slim image ships curl without them), Piper at `/opt/piper` (`PIPER_BIN`, `PIPER_VOICES`).
- One Chrome Headless Shell for all projects, baked into the image at `/opt/remotion-browser` and pointed at by `REMOTION_CHROME`, which `remotion.config.ts` passes to `Config.setBrowserExecutable()`. Without it Remotion downloads its own 220 MB copy per project.
- `Config.setIPv4(true)` in `remotion.config.ts` is required for port forwarding to the Windows browser.
- Do not call `Config.setPort()`; it conflicts with rendering.
- `preserveSymlinks` (tsconfig) and `resolve.symlinks: false` (webpack, via `Config.overrideWebpackConfig`) are required for imports from `@harness/visuals` to resolve. See rule 30.
- Renders go to `out/` (git-ignored). Final deliverables go to the client's `deliveries/` (git-ignored, never versioned).

## Versioning

- Remotion is pinned to one exact version across the Dockerfile, templates and clients. Never use `"latest"`.
- Upgrades happen deliberately with `npx remotion upgrade`, then an image rebuild.
- Nothing is pushed to a remote until a repository is declared done. Identity is configured per repository.
