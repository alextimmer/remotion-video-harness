# Video harness

Tooling for producing short-form videos (Reels, Shorts, TikTok) with
[Remotion](https://www.remotion.dev) inside a Docker devcontainer, driven by
coding agents. The harness is brand-neutral and publishable; each client's
content lives in its own repository under `projects/<client>/` (git-ignored
here). Step by step: `HOWTO.md`. Agent
instructions: `AGENTS.md` (generated from `agents/rules/`).

## Getting started from a blank Windows PC

Everything technical runs inside a Docker **development container**: Node 22,
the pinned Remotion, Chrome Headless Shell for rendering, FFmpeg, the Piper
voices, whisper.cpp for subtitles. Nothing of that is installed on Windows.
VS Code opens the project folder *inside* that container, so every person and
every machine gets the identical, pinned toolchain, and a broken environment
is fixed by rebuilding the container, never by hunting through a Windows
install. The definition lives in [`.devcontainer/`](.devcontainer/); the open
standard behind it is described at [containers.dev](https://containers.dev/).

### 0. Two kinds of repository — which one is yours?

| Repository | Contains | Who commits to it |
|---|---|---|
| **The harness** (this one) | tooling, rules, skills, shared components, the pipeline. Brand-neutral, publishable. | its maintainers. If you only *use* the harness, you clone it and pull updates; you do not commit your videos here. |
| **One client repository per client**, under `projects/<client>/` | that client's brand, legal limits, reels, voice clips. Private. Each is its own git repository; the harness ignores the whole `projects/` folder. | you, for your clients. This is where all your work lands. |

So the workflow for a user of the harness is: clone the harness, then either
**restore existing client repositories** into `projects/` (`projects.yaml` +
`scripts/clone-project.sh`) or **start a new client** with
`scripts/new-project.sh <client>`, which creates a fresh git repository under
`projects/<client>/` that you push to your own remote. Commits, tags and
pushes for your videos happen inside that client repository, never in the
harness. A client repository works only while it sits inside the harness
checkout, because it links the shared packages by relative path.

### 1. Install once on Windows

| Tool | Why you need it | How |
|---|---|---|
| **WSL 2** (Windows Subsystem for Linux) | Docker containers are Linux programs; WSL 2 gives Windows a real Linux kernel to run them on. Docker Desktop uses it as its engine. | Open PowerShell **as administrator**, run `wsl --install`, reboot. Needs Windows 10 21H2 or Windows 11 with virtualization enabled in the BIOS/UEFI (most PCs have it on). Docs: [install WSL](https://learn.microsoft.com/windows/wsl/install), [what WSL is](https://learn.microsoft.com/windows/wsl/about). |
| **Docker Desktop** | Builds the container image and runs the container. | [Install Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/); in Settings → General keep "Use the WSL 2 based engine" ticked ([WSL backend](https://docs.docker.com/desktop/features/wsl/)). Start it; the whale icon in the tray must be steady before you open the project. |
| **Git for Windows** | Clone the harness and the client repositories; commit from the terminal. | [git-scm.com/download/win](https://git-scm.com/download/win). Defaults are fine. |
| **Visual Studio Code** + the **Dev Containers** extension | The editor, and the extension that opens a folder inside its container. | [Download VS Code](https://code.visualstudio.com/download), then install [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers). Background reading: [Developing inside a Container](https://code.visualstudio.com/docs/devcontainers/containers), [tutorial](https://code.visualstudio.com/docs/devcontainers/tutorial). |
| *(optional)* **Claude Code** | The coding agent this harness is built around. | Installed automatically inside the container by the devcontainer definition; you sign in once. [Claude Code in VS Code](https://code.claude.com/docs/en/vs-code). |

**Not** needed on Windows: Node.js, npm, FFmpeg, Chrome, Python. They live in
the container. Disk: about 3–4 GB for the image, roughly 0.5 GB per installed
project, 0.5 GB for the whisper model on the first voiceover. Docker's data
sits in a WSL virtual disk that grows but does not shrink by itself
([reclaiming WSL disk space](https://learn.microsoft.com/windows/wsl/disk-space)).

macOS and Linux: skip WSL, install [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
or [for Linux](https://docs.docker.com/desktop/setup/install/linux/), then the
same VS Code steps.

### 2. Get the harness and open it in the container

1. Clone the harness into a folder **without spaces** on your Windows drive,
   for example `C:\dev\claude-remotion`:
   ```
   git clone <your harness repository URL> claude-remotion
   ```
   (No repository yet? Copy the folder. The harness is self-contained.)
2. Open that folder in VS Code. A notification offers **Reopen in Container**;
   accept it (or press F1 → *Dev Containers: Reopen in Container*).
3. The first start builds the image: 5–15 minutes depending on your connection.
   It downloads Node, the pinned Remotion, Chrome Headless Shell, FFmpeg, Piper
   and its voices. Then `post-create.sh` installs the Agent Skills, one
   format template and every client project it finds. Watch the progress in
   the terminal panel; the last line is `=== Ready. See HOWTO.md ===`.
4. Check it works: open a terminal in VS Code (it is now a Linux shell inside
   the container) and run
   ```
   node -v                      # v22.x
   ls /opt/piper/voices         # the free voices
   scripts/check-client.sh <client>   # if a client project exists
   ```
5. Personal files, all git-ignored: copy `.env.example` to `.env` only if you
   have a cloud TTS key; copy `.leakwords.example` to `.leakwords` and fill in
   the client words the leak gate must catch; `CLAUDE.local.md` holds your
   own notes and preferences for the agent.
6. Claude Code: click its icon in the VS Code sidebar and sign in. The login
   is stored in a Docker volume (`remotion-harness-claude-home`), so it
   survives container rebuilds.

Existing client repositories: fill `projects.yaml` from `projects.example.yaml`
and run `./scripts/clone-project.sh` inside the container. A new client
starts with `scripts/new-project.sh <client>`.

### 3. What lives where

- **Your project folder on Windows** is mounted into the container; both sides
  see the same files. Source, rules, scripts, renders and deliveries are there.
  `node_modules`, `out/`, `deliveries/` and `projects/` are git-ignored, so the
  repository itself stays small (a few MB) and anything installed is
  regenerated by the container.
- **The tools** (Node, Remotion, Chrome, FFmpeg, Piper) exist only inside the
  image. A Dockerfile change needs *Dev Containers: Rebuild Container*.
- **The Claude Code login** lives in a Docker volume, nothing else does.
- **Renders** go to `projects/<client>/out/`, **deliverables** to
  `projects/<client>/deliveries/`; both are visible in Explorer on Windows.

### 4. If something does not work

| Symptom | Cause and fix |
|---|---|
| No "Reopen in Container" offer | Dev Containers extension missing, or Docker Desktop not running. Install / start, then F1 → *Reopen in Container*. |
| Build stops with a virtualization or WSL error | `wsl --install` did not finish (reboot pending) or virtualization is off in the BIOS/UEFI. Run `wsl --status` in PowerShell. |
| Claude Code sign-in reports a failure, terminal shows `EACCES` under `/home/node/.claude` | The volume is owned by root (old image). Rebuild the container; if it persists, on Windows run `docker run --rm -v remotion-harness-claude-home:/v alpine chown -R 1000:1000 /v` and retry. |
| First render fails with "Timed out after 25000 ms while trying to connect to the browser" | Chrome cold start after heavy disk activity. The render and verify scripts retry once; run the command again if it still fails. |
| `npm install` or the type check feels slow (minutes / ~30 s) | The Windows bind mount is slow for many small files. Expected; Docker volumes for `node_modules` would speed it up and can be added later. |
| Studio does not open on http://localhost:3000 | Port 3000 is forwarded by the devcontainer; make sure `scripts/start-studio.sh` is running and nothing else uses the port. |
| Disk fills up | WSL's virtual disk keeps freed space; see the Microsoft page linked above. Delete `projects/<client>/out/` renders you no longer need. |

Daily work after setup: [`HOWTO.md`](HOWTO.md) and the table below.

## What is in here

| Part | Where | What it does |
|---|---|---|
| Visuals package | `packages/visuals/` (`@harness/visuals`) | Themed, reusable animation components plus the voice/subtitle components and `deriveVoiceTiming`. `INDEX.md` is the lookup table. |
| Audio pipeline | `packages/pipeline/` (`@harness/pipeline`) | `script.md` → TTS (plugin providers, free local Piper by default) → exact pauses → whisper word timings → subtitle pages → `voice/generated.ts`. Mastering to −14 LUFS. |
| Scripts | `scripts/` | One shell command per step (table below). |
| Rules | `agents/rules/` | Memory routing, toolchain, craft (reels, motion, audio, food-law), visuals protocol, client gate, decisions, learnings, open decisions. |
| Skills | `.agents/skills/` | `onboarding-clients`, `video-production`, `visuals-library` (harness-authored) plus the official Remotion skills. Claude Code reads them through `.claude/skills`. |
| Reviewer | `.claude/agents/reviewer.md` | Read-only subagent that inspects verification stills against the craft rules and the client's legal list. |
| Hooks | `.claude/hooks/`, `.claude/settings.json` | Claude Code enforcement of the checkable rules: no push, no deleting deliveries or voice clips, no client words in harness files, READY client before reel scripts, commit hygiene, visuals index before a new component, render measured after every render, pronunciation report after every voiceover, AGENTS.md regenerated after rule edits, type check after edits, state summary at session start, memory and stills reminders. Each hook calls a script under `scripts/` or reads files any agent can read. |
| Templates | `templates/` | `insta-reel`, `landscape-1080p`, `square` formats; `client-repo` skeleton. |
| Voices, music | `assets/voices/`, `assets/music/` | Free voice presets and the Piper voices baked into the image; licensed beds with `LICENSES.md`. |

## When to run what

Agents pick these up from the skills automatically (each skill's description
says when it applies); you can also invoke a skill by name or run the commands
yourself. Every command runs inside the container from the harness root.

| You want to … | Run | Guided by |
|---|---|---|
| set up a new client | `scripts/new-project.sh <client> [format]` | then `onboarding-clients` |
| check whether a client is ready for reel work | `scripts/check-client.sh <client>` → must print `READY` | rule 40 |
| answer the brand, legal, voice questions | — (the agent asks, you answer; files under `projects/<client>/agents/rules/`, `src/brand/theme.ts`, `src/brand/voices.json`) | `onboarding-clients` |
| start a new reel or a new version | `scripts/new-reel.sh <client> <reelId> <sceneId…>` | `video-production` phases 1–3 |
| find an animation instead of building one | read `packages/visuals/INDEX.md` | `visuals-library` |
| write the voiceover | edit `src/reels/<id>/script.md`, then `scripts/voiceover.sh <client> <reelId>` | `video-production` phase 4, rule 22 |
| see which voices exist | `scripts/voiceover.sh <client> <reelId> --list-voices` | `packages/pipeline/README.md` |
| add a music bed (optional) | licence row in `assets/music/LICENSES.md`, `<MusicBed>` in `Reel.tsx`; `scripts/music-placeholder.sh` for tests only | phase 5, rule 22 |
| preview in the browser (optional) | `scripts/start-studio.sh <client>` → http://localhost:3000 | — |
| render | `scripts/render.sh <client> Reel-<id>` | phase 7 |
| check the pixels | `scripts/verify.sh <client> Reel-<id> <frame…>`, then look at `out/verify/`, or hand them to the `reviewer` | phase 8 |
| set delivery loudness | `scripts/master.sh <client> out/Reel-<id>.mp4` | phase 8, rule 22 |
| deliver | copy the mastered MP4 to `projects/<client>/deliveries/`; commit locally | phase 9 |
| change a rule | edit `agents/rules/*.md`; the hook regenerates `AGENTS.md` (by hand: `scripts/sync-agents.sh` or `--client projects/<client>`) | rule 00 |
| check a render's numbers | `scripts/check-render.sh <client> out/Reel-<id>.mp4` (frames, loudness, black tail; runs automatically after `render.sh`) | phase 8 |
| keep client words out of the harness | `scripts/leak-gate.sh` (word list in git-ignored `.leakwords`; runs automatically on every harness write) | rule 00 |
| upgrade Remotion | `scripts/upgrade.sh [version]`, then rebuild the container | rule 10 |
| see what is still yours to decide | `agents/rules/82-open-decisions.md`, client `agents/rules/85-open-decisions.md` | — |

## The voiceover, in one picture

```
src/reels/<id>/script.md          src/brand/voices.json         (client: which voice)
  ## hook                          assets/voices/presets.json    (harness: free defaults)
  Spoken line [pause 0.4] …                │
  > subtitle: written form                 │
          │                                │
          └──── scripts/voiceover.sh ──────┘
                        │
     public/audio/<id>/<scene>.wav   +   src/reels/<id>/voice/generated.ts  (data, do not edit)
                        │
   Reel.tsx: <VoiceProvider index={VOICE}>      timing.ts: deriveVoiceTiming(VOICE, designed, …)
   scene:    <Voice scene="hook" />             (scene length = max(designed, voice))
             <Voice scene="far" subtitles />    (subtitles only where the line is not on screen)
```

The scene's own on-screen text stays in the scene's `.tsx`; the script only
carries what is spoken. `script.ts` with `defineScript()` replaces `script.md`
when the text is assembled from data. Details: `agents/rules/22-craft-audio.md`,
`packages/pipeline/README.md`.

## Principles

- **Brand facts come from the client, never from the agent.** The gate
  (`check-client.sh`) blocks reel work until profile, brand, legal and theme
  are confirmed; deferred decisions live in the open-decision registers.
- **Nothing is done before it has been rendered and looked at.** Stills, the
  reviewer, loudness measurement; the user approves the MP4.
- **Local commits only.** Repositories are published whole, by you, when you
  declare them done. No remotes are configured by agents.
- **One version, one composition.** New versions are new reel folders; old
  ones stay renderable.

## Requirements

Docker Desktop and VS Code with the Dev Containers extension. No Node.js on
the host. The container brings Node 22, the pinned Remotion, Chrome Headless
Shell, FFmpeg, Piper and (on first use) whisper.cpp.

## License

Copyright 2026 Alexander Timmer. Licensed under the Apache License, Version 2.0;
see [LICENSE](LICENSE). You may use, modify and redistribute this harness, with
attribution and without any right to the author's name or trademarks. The license
covers the harness only: Remotion has its own license terms (remotion.dev/license),
and third-party data and assets carry the licenses named in their file headers or
`LICENSES.md` files.
