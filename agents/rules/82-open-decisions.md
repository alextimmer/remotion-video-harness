# Open decisions (harness)

Decisions that belong to the user and have been deferred. **Agents do not
resolve these on their own** — not as a proposal, not as a default. When work
touches one, do the part that is independent of it and ask. When a decision
is made, move the row to `80-harness-decisions.md` with the date.

Add a row whenever a decision is left to the user. Client-specific open items
live in the client's `agents/rules/85-open-decisions.md`.

| Raised | Decision | Options / notes | Interim behaviour | Needed by |
|---|---|---|---|---|
| 2026-09-21 | Replace the hand-placed globe coastlines with Natural Earth 110m (public domain)? | Same `[lat, lon][]` format, drop-in; more accurate continents; slight visual change to reels using the globe. | Keep the hand-placed data, provenance stated in the file header. | When accuracy matters for a reel |
| 2026-09-21 | Should the format templates' starter `MainComp` wrap `<VisualsThemeProvider>`? | (a) Keep unthemed: blue defaults are a visible "not themed yet" signal. (b) Wire the skeleton theme in the template for a themed first render. | (a) — new projects render defaults until the client theme is wired in a reel. | Next new client |
| 2026-09-18 | Publish `@harness/visuals` to a registry? | Only worthwhile once a second person or machine must consume it without the harness checkout. | `file:` link inside the harness. | Second consumer |
| 2026-09-21 | Default local Piper voice for draft voiceovers | Samples in `out/voice-samples/`: `de_DE-thorsten-high` (male, best quality), `de_DE-kerstin-low` and `de_DE-ramona-low` (female, lower quality). The first line of `assets/voices/piper-voices.txt` is the default; changing it means one line + rebuild. | `de_DE-thorsten-high`. | Before the first voiced delivery |
| 2026-09-21 | Which cloud TTS adapters to add, and when | Providers are plugins (`packages/pipeline/voiceover/providers/`); the ElevenLabs adapter ships untested until a key exists. Others (OpenAI, Azure, Google) are one file each. Local cloning models need a licence check each (several are non-commercial). | Piper only; a missing key fails loudly with the free fallback named. | When a key or a cloning need appears |
| 2026-09-21 | Music sourcing and licensing for `assets/music/` | Royalty-free library vs. commissioned vs. generated; license terms must permit paid social advertising. | None — user 2026-09-23: no music for now; reels ship voice-only or silent, `<MusicBed>` stays available. | When the user wants music |
| 2026-09-18 | Optional `.mcp.json.example` for media MCP servers (TTS, stock, analysis) | Paid keys and extra toolchain; only if the direct API scripts of Phase 8 prove insufficient. | Not added. | After Phase 8 |
| 2026-09-18 | Further Claude subagents beyond the reviewer (director, media scout, post-producer) | Adapters under `.claude/agents/`; value unclear until the production skill has run on a real reel. | Reviewer only. | After first production run |
| 2026-09-18 | Headless brief-to-MP4 CLI; web UI | "Later" in the plan; scope undefined. | Scripts + skills. | — |
| 2026-09-21 | Delete `docs/local/MIGRATION.md` when the migration is complete | It names the client, so it is git-ignored; its status table is superseded by the tags and session logs once Phase 8 lands. | Keep and update. | End of migration |
