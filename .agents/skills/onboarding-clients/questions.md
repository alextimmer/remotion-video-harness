# Onboarding question catalog

Ask in the user's language. One question per message in guided mode; the express
list in one message. Offer options where marked, never a silent default.

## Express (eight questions, one message)

1. Client name as it should appear, and website URL for CTAs?
2. Which products or services does this first reel promote?
3. Who watches, on which platform, in which language?
4. Brand colors: hex values, a brand guide, or a logo file I can read them from? (If none: choose one of three named palettes I propose.)
5. Font: a named brand font, or pick one of three options I propose?
6. Logo file available? Where should it appear?
7. Regulated category (food, health, finance, alcohol, children, cosmetics, supplements)? Which claims are cleared, which are off limits?
8. Closing element: hashtag, claim, URL only?
9. Voiceover planned? If yes: a chosen voice (provider + voice id), or one of the free local voices as interim until you decide?

## Guided, per file

### 00-client-profile.md
- Legal entity and brand name; how the brand is written on screen.
- Products or services, and which ones this project covers.
- Websites and URLs used in CTAs.
- Audience: who, where (platform), language, device.
- Deliverables: formats and resolutions; does the client run the code or only receive MP4s?
- Contact for approvals (name or role only).

### 10-brand.md
- Overall look in three adjectives; what is explicitly excluded.
- Font: named brand font, or choose from options (offer three with one-line rationale).
- Recurring motifs, shapes, textures.
- Logo: file, clear space, allowed backgrounds.
- Closing element: hashtag, claim, URL.
- Pacing preference: calm or fast; any reference reels they like.
- Voice for voiceover: character, gender, language; existing voice id. → becomes the `narrator` preset in `src/brand/voices.json`.
- Competitors: may they be named, compared, shown?

### 20-legal.md
- Product category and applicable regulation as the client understands it.
- Claims already cleared by the client (exact wording).
- Claims explicitly forbidden (exact wording).
- Required disclaimers, age gates, price display rules.
- Who signs off on wording.

### src/brand/theme.ts
- Colours, as the skeleton names them: background, surface, text, textSoft, muted, subtle, accent, accentLight, accentDark. The accent trio matters most — the visuals package uses all three.
- Accent plus light and dark variant; are they defined or should I derive them?
- Fonts (display, body) and weights to load.
- Video format for this client (1080x1920 default).
- Source of the values (brand guide version, logo file, or user message date) for the `Source:` comment.

### src/brand/voices.json
- Voiceover at all? (No → no file.)
- Provider and voice id, or interim pick among the free presets in `assets/voices/presets.json` (offer to render a sample line).
- Language of the voice; speaking rate or other provider settings the client cares about.
- Cloned voice? Only with written consent and provider terms on file in `20-legal.md`.
- Pronunciation list for product names, abbreviations, URLs (spoken form vs written form) — goes into `10-brand.md` with the voice.

### First reel note (agents/rules/reels/<id>.md)
- Purpose and key message in one sentence.
- Length target and scene list.
- Assets available (photos, footage, audio) or icons as placeholders.
- Music or voiceover wanted?
