# How to work in this harness

The harness is the tooling. Client videos live in their own repositories under
`projects/`. Overview and the "when to run what" table: `README.md`.
Agent instructions: `AGENTS.md` (generated from
`agents/rules/`). Everything below runs inside the container, from the harness
root.

## 1. Open in the container

First time on a machine? `README.md` → "Getting started from a blank Windows
PC" covers WSL 2, Docker Desktop, VS Code and the Dev Containers extension
with links. Then: open this folder in VS Code and choose **Reopen in Container**. The first build
downloads Node 22, the pinned Remotion CLI, Chrome Headless Shell, FFmpeg and
the free Piper voices listed in `assets/voices/piper-voices.txt`.
`post-create.sh` installs the Agent Skills, checks the generated instructions
and installs dependencies for the templates and every project under `projects/`.
After a Dockerfile change: **Rebuild Container**.

Secrets: copy `.env.example` to `.env` (git-ignored) when a cloud TTS provider
needs a key. The free local voice needs none.

## 2. Restore or create client projects

```bash
./scripts/clone-project.sh              # clone everything listed in projects.yaml
scripts/new-project.sh acme-videos      # new client repo, Instagram Reel format
scripts/new-project.sh acme-videos landscape-1080p
```

`projects.yaml` is git-ignored (it names your clients); `projects.example.yaml`
shows the format. Each project is an independent git repository with its own
remote; the harness never tracks it and you never commit client work into the
harness. Existing clients: list them in `projects.yaml` and clone. New client:
`new-project.sh`, then add your remote inside `projects/<client>/` and push
there. A new project links `@harness/visuals` and `@harness/pipeline`
from this checkout, so it installs only while it sits under `projects/`.

## 3. Onboard the client

```bash
scripts/check-client.sh acme-videos     # NOT READY until onboarding is done
```

Tell your agent "onboard client acme-videos" (skill `onboarding-clients`). It
asks you, file by file or in one express message, for profile, brand, legal
limits, the theme values and the voice, and writes:

| File | Holds |
|---|---|
| `agents/rules/00-client-profile.md` | who, products, URLs, audience, language, deliverables |
| `agents/rules/10-brand.md` | look, font rationale, motifs, logo, closing element, pacing, voice character |
| `agents/rules/20-legal.md` | allowed and forbidden phrasings; voice-cloning consent if any |
| `src/brand/theme.ts` | colours, fonts, springs, format, `visualsTheme` mapping — the only place for brand values |
| `src/brand/voices.json` | the `narrator` voice preset (provider, voice id, language, settings); interim free voice if undecided |

Nothing in these files is invented by the agent. The gate prints `READY` when
all are confirmed by you; open questions go into `agents/rules/85-open-decisions.md`.

## 4. Produce a reel

Tell your agent what the reel is for (skill `video-production`). The phases,
each with a checkpoint you confirm:

1. **Brief** — purpose, audience, message, length → `agents/rules/reels/<id>.md`.
2. **Storyboard** — scenes with on-screen copy, visuals, audio plan; every
   line checked against `20-legal.md`.
3. **Build** — `scripts/new-reel.sh acme-videos <id> hook far cta` scaffolds
   `src/reels/<id>/` (reel, timing, script, scenes, composition, note stub);
   the agent fills the scenes with the storyboard copy and components from
   `packages/visuals/` (skill `visuals-library`). Stills before any audio.
4. **Voiceover** — the spoken lines go into `src/reels/<id>/script.md`:

   ```markdown
   voice: narrator
   pause-before: 0.4
   pause-after: 0.7

   ## far
   Twelve thousand kilometres [pause 0.4] halfway around the globe.
   > subtitle: 12,000 km – halfway around the globe.
   ```

   then `scripts/voiceover.sh acme-videos <id>`. Clips land in
   `public/audio/<id>/`, timings in `voice/generated.ts`; scene lengths grow
   to fit the voice, never the reverse. Read the "heard:" lines: they are the
   pronunciation report. `--list-voices` shows every preset.
5. **Music** (optional, your call per client) — a licensed bed
   (`assets/music/LICENSES.md` row first) via `<MusicBed>`;
   `scripts/music-placeholder.sh` makes a test pad that never ships. Without
   it, reels ship voice-only or silent.
6. **Subtitles** — `<Voice scene="…" subtitles />` only where the spoken line
   is not already on screen. Subtitles are the voice's transcript for muted
   viewers; the scene's own text stays in its `.tsx`.
7. **Render** — `scripts/render.sh acme-videos Reel-<id>` → `projects/acme-videos/out/`.
8. **Verify** — `scripts/verify.sh acme-videos Reel-<id> 30 200 500` writes
   stills to `out/verify/`; look at them or let the `reviewer` subagent report.
   `scripts/master.sh acme-videos out/Reel-<id>.mp4` sets −14 LUFS / −1 dBTP.
   You watch the MP4 and approve.
9. **Deliver** — the mastered MP4 goes to `projects/acme-videos/deliveries/`
   (never versioned); the reel note says delivered; local commit.

Preview in the browser, if you want it: `scripts/start-studio.sh acme-videos`
→ http://localhost:3000. Rendering never needs Studio.

From a plain terminal without VS Code:

```bash
docker compose run --rm render acme-videos Reel-<id>
docker compose run --rm verify acme-videos Reel-<id> 30 200 500
```

## 5. Decisions that are yours

Agents do not pick brand values, voices, music, claims or remotes. What they
have deferred is listed with options and interim behaviour in
`agents/rules/82-open-decisions.md` (harness) and
`projects/<client>/agents/rules/85-open-decisions.md` (client). Decide there,
and the agent moves the row into the decisions log.

## 6. Hooks (Claude Code)

`.claude/settings.json` wires fourteen hooks (`.claude/hooks/*.mjs`) that
enforce the checkable rules. Blocking: no `git push` or remotes from an agent;
no deleting or moving under `deliveries/` or `public/audio/`; no client words
written into harness files (`.leakwords`, copy from `.leakwords.example`);
`check-client.sh` must print READY before `render.sh`, `verify.sh`,
`voiceover.sh`, `new-reel.sh` or `master.sh` run; a `git commit` needs a
current `AGENTS.md` and, in the harness, a clean staged leak gate. Informing:
the visuals index is shown before a new component file is written and the
storing protocol is checked after a package edit; every `render.sh` is
followed by `check-render.sh`; every `voiceover.sh` by its pronunciation
report; every rule edit regenerates `AGENTS.md`; every `.ts`/`.tsx` edit is
type-checked in the background and wakes the agent on failure; a session
starts with the repo state and the open decisions; reminders at turn end
(memory, scenes changed without a newer still) and before context compaction
(write the session log first). Hooks load at session start — after editing
them, restart the session. Other agents get the same checks by running the
scripts themselves.

## 7. Rules and memory

- Rules are separate files in `agents/rules/` (harness) and
  `projects/<client>/agents/rules/` (client). After editing, run
  `scripts/sync-agents.sh` or `scripts/sync-agents.sh --client <dir>`; the
  gate fails on a stale `AGENTS.md`.
- Where each kind of information belongs: `agents/rules/00-memory-routing.md`.
  Client names never appear in harness files.
- Personal notes go to `CLAUDE.local.md` (git-ignored).

## 8. Upgrade Remotion

```bash
scripts/upgrade.sh            # pins the same version everywhere, updates skills
```

Then commit and rebuild the container so Chrome Headless Shell matches.

## 9. Publishing

Nothing is pushed by agents. When a repository is done, add the remote
yourself and push it whole; identity per repository (noreply address by
default).

## Templates

| Template          | Resolution | Use case                           |
|-------------------|------------|------------------------------------|
| `insta-reel`      | 1080x1920  | Instagram Reels, TikTok, Shorts    |
| `landscape-1080p` | 1920x1080  | YouTube, presentations, ads        |
| `square`          | 1080x1080  | Instagram feed, Facebook posts     |
| `client-repo`     |            | skeleton merged into every new client repo |
