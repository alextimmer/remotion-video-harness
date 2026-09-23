---
name: onboarding-clients
description: Use when a client project under projects/ was just created, when scripts/check-client.sh reports NOT READY, when agents/rules/00-client-profile.md, 10-brand.md, 20-legal.md or src/brand/theme.ts still hold template values or OPEN markers, or before building the first reel for a client whose brand, profile or legal rules the user has not confirmed.
---

# Onboarding clients

## Overview

A client repository starts as a skeleton. Onboarding turns it into a confirmed
knowledge base: profile, brand prose, legal limits, brand theme. The user is the
only source of brand facts. **No brand value without a source.** Colors, fonts,
logo, claims, tone and legal wording are never invented, not even "as a
proposal to adjust later", because a theme baked into a built reel is rework.

Violating the letter of this rule is violating its spirit.

## When to use

- `scripts/check-client.sh <client>` prints `NOT READY`.
- Right after `scripts/new-project.sh <client>`.
- The user asks for a reel and the client files still show `Status: OPEN`, `CLIENT_NAME`, `<!-- -->` comments or `OPEN:` markers.

Not needed when the check prints `READY`.

## Process

1. Run `scripts/check-client.sh <client>`. Read what is missing.
2. Choose the mode with the user:
   - **Guided** (default when the user has no brand material at hand): one question at a time, in the user's language, file by file. Offer named options where a choice helps, never a silent default.
   - **Quick** (user hands over a brief, brand guide, website or logo): draft all four files from the material, mark every unknown as `OPEN: <question>`, then ask only the OPEN items in one batch.
   - **Express** (user in a hurry): ask the eight express questions from `questions.md` in one message. Until answers arrive, do only brand-independent work: reel folder, scene structure, copy draft using theme tokens, `agents/rules/reels/<id>.md`. Do not touch `theme.ts` values.
3. Fill `agents/rules/00-client-profile.md`, `10-brand.md`, `20-legal.md`. Remove template comments. End each with `Status: confirmed by <user> on <YYYY-MM-DD>` only after the user confirmed the content.
4. Fill `src/brand/theme.ts` from the user's values: the `COLOR` tokens, `FONT_DISPLAY`/`FONT_BODY` (loaded in `src/brand/fonts.ts` from a family the user named or chose from options you offered) and, if the user wants a different motion character, `SPRING`. Replace the `Source: OPEN:` line with the real source (`// Source: <brand guide / logo file / user message date>`). The `visualsTheme` export at the bottom maps the tokens onto the `@harness/visuals` roles and is already wired — adjust it only if the client's palette has tokens that fit a role better. Every reel root wraps `<VisualsThemeProvider theme={visualsTheme}>`; the gate checks both.
5. Voice: ask whether reels will carry a voiceover (`questions.md`, voice
   section). Three outcomes, all the user's:
   - **No voiceover planned** → no file; the gate only warns.
   - **Voice chosen** (a provider voice id, a cloned voice with consent on
     file in `20-legal.md`) → write `src/brand/voices.json` with that
     preset as `narrator` and `"default": "narrator"`; name the character
     in `10-brand.md`; provider settings (model, stability, rate) go into the
     preset, never into a script.
   - **Voiceover wanted, voice not decided** → offer the free harness presets
     (`assets/voices/presets.json`; render a sample line with
     `scripts/voiceover.sh` if the user wants to hear them). The user picks
     one as interim; write `voices.json` with a `$comment` saying INTERIM
     and add the row to `85-open-decisions.md`. The decided voice later
     replaces that one preset; scripts keep naming `narrator`.
   ```json
   {"$comment": "INTERIM — voice decision open (85-open-decisions.md)",
    "default": "narrator",
    "voices": {"narrator": {"provider": "piper", "voiceId": "<from presets.json>", "language": "de"}}}
   ```
   Voice cloning of a real person needs written consent and provider terms
   that allow it, recorded in `20-legal.md` first (`22-craft-audio.md`).
6. Legal: ask the category question (food, health, finance, alcohol, children, cosmetics, supplements) and record allowed and forbidden phrasings the user gives. Do not draft legal rules from general knowledge alone; propose a checklist, let the user confirm.
7. Run `scripts/check-client.sh <client>` until `READY`, then `scripts/sync-agents.sh --client projects/<client>` and commit in the client repository.
8. Record the onboarding in the client `80-memory-decisions.md` and `90-memory-sessions.md`.

Question catalog and the express list: `questions.md` in this folder.

## Quick reference

| File | Must contain | Source |
|---|---|---|
| `00-client-profile.md` | who, products, URLs, audience, language, deliverable format | user |
| `10-brand.md` | look, font rationale, motifs, logo path, closing element, pacing, voice, competitor policy | user, brand guide |
| `20-legal.md` | category, allowed phrasings, forbidden phrasings | user (legal owner) |
| `src/brand/theme.ts` | colors, fonts, springs, format, `Source:` comment, `visualsTheme` mapping | brand guide, logo, user choice |
| `src/brand/voices.json` | `narrator` preset (provider, voiceId, language, settings), `default`; INTERIM comment + open-decision row if undecided | user (voice choice), `assets/voices/presets.json` for free options |
| `reels/<id>.md` | purpose, scenes, status | brief |

## Red flags — stop and ask instead

- "I'll pick a tasteful palette and mark it unconfirmed."
- "The user is in a hurry, so I'll assume and note the questions."
- "These fonts fit a bakery; they can swap later."
- "Standard advertising law is enough for the legal file."
- "The brand file is filled, so onboarding is done." (Filled is not confirmed.)
- "I'll put the free voice in voices.json without asking — it's only the default." (Even the interim is the user's pick.)

| Excuse | Reality |
|---|---|
| Hurry | Express mode takes one message. Rework of a wrong theme takes hours. |
| Marked as proposal | Proposals in `theme.ts` get rendered and delivered. |
| Questions written down for later | Later never comes once the reel exists. Ask now, build brand-independent parts meanwhile. |
| Generic legal knowledge | Only the client knows which claims were cleared. Record theirs. |

## Common mistakes

- Repeating hex values or font names in `10-brand.md`. Prose references `theme.ts`.
- Leaving `<!-- -->` template comments in filled files. The gate fails on them.
- Confirming on the user's behalf. The `Status: confirmed` line is written after the user says yes.
