# Memory routing (read first)

This workspace is shared by several coding agents. Knowledge lives in plain
markdown files with exactly one owner layer. `AGENTS.md` is generated from
`agents/rules/*.md` by `scripts/sync-agents.sh`; never edit `AGENTS.md` by hand.

## Layers

| Layer | Where | Contains | Publishable |
|---|---|---|---|
| A Harness | this repository | tooling, generic craft, reusable visuals | yes |
| B Client | one repo per client under `projects/<client>/` | brand, products, legal limits, reels | no |
| C User | `CLAUDE.local.md` (git-ignored) | environment, preferences, identities | never |

A repository contains files of one layer only. Client names, products, cities,
competitors or brand values must never appear in harness files.

## Where to write what

| Information | Layer | File |
|---|---|---|
| Toolchain fact, gotcha, workaround | A | `agents/rules/81-harness-learnings.md` |
| Workspace or architecture decision | A | `agents/rules/80-harness-decisions.md` |
| Craft rule valid for any client | A | `agents/rules/2x-craft-*.md` (reels, motion, audio, legal-food) |
| Decision deferred to the user, harness level | A | `agents/rules/82-open-decisions.md` — agents never resolve these |
| How to store a reusable visual | A | `agents/rules/30-visuals-protocol.md` |
| Harness session summary | A | `agents/rules/90-harness-sessions.md` |
| Brand values (colors, fonts, spacing) | B | client `src/brand/theme.ts`, the only source |
| Brand prose: tone, audience, language, hashtags, URLs, voice | B | client `agents/rules/10-brand.md` |
| Client legal limits | B | client `agents/rules/20-legal.md` |
| Client profile, products, contacts | B | client `agents/rules/00-client-profile.md` |
| Per-reel purpose, scenes, durations, status | B | client `agents/rules/reels/<id>.md` |
| Client decisions / session log | B | client `agents/rules/80-memory-decisions.md`, `90-memory-sessions.md` |
| Decision deferred to the user, client level | B | client `agents/rules/85-open-decisions.md` — agents never resolve these |
| User environment and preferences | C | `CLAUDE.local.md` in the harness root |

## Rules

- Update memory files as you go, not at the end. Do not ask, just write.
- A session that touches both layers writes to both session logs.
- Every memory entry heading carries date, description and agent:
  `## YYYY-MM-DD: Description [Agent name]`.
- Prose files never repeat brand values; they reference the client theme file.
- After editing any `agents/rules/*.md`, run `scripts/sync-agents.sh`
  (harness) or `scripts/sync-agents.sh --client projects/<client>` (client).
- Agent auto-memory (if the agent has one) is Layer C only. Project knowledge
  always goes into repository files.
