---
name: visuals-library
description: Use before building any animation, icon, background or data visual for a reel, when a scene needs a badge, jar, map, globe, certificate, coin counter, hex background, particle layer or text effect, when a component from @harness/visuals renders with a blue accent (unthemed), or when a new reusable visual is finished and must be stored. Points to the existing components in packages/visuals so nothing is rebuilt, and to the theme contract so nothing ships unthemed.
---

# Visuals library

## Overview

`packages/visuals` (`@harness/visuals`) holds every reusable, brand-neutral
animation component. Client projects import from it; nothing is copied.
**Do not rebuild a visual that already exists.** Check the index first, every
time — the cost of a lookup is seconds, the cost of a duplicate is a second
implementation to keep in sync forever.

## Before building anything

1. Read `packages/visuals/INDEX.md` and match your need against the keywords.
2. Read the matching folder's `_meta.md`: it records why the component looks
   the way it does (research, key prompts), the props, and how it adapts.
3. Import it and pass the client's texts and values as props. Never edit the
   component to hard-code a client string.
4. If nothing matches, build it in the client first, verify it with stills,
   then store it (below).

## Using a component

```tsx
import {VisualsThemeProvider, PriceBalanceBadge} from '@harness/visuals';
import {visualsTheme} from '../../../brand/theme';

// Once at the root of each Reel.tsx — the gate checks for it:
<VisualsThemeProvider theme={visualsTheme}>
	<TransitionSeries>…</TransitionSeries>
</VisualsThemeProvider>

// In a scene — client content as props:
<PriceBalanceBadge startFrame={30} leftLabel="Import" rightLabel="Regional" leftPrice="60 €" rightPrice="12 €" />
```

- Colours, fonts and springs come from the theme contract
  (`packages/visuals/src/theme.ts`): roles `accent`, `accentLight`,
  `accentDark`, `foreground`, `foregroundSoft`, `muted`, `subtle`, `surface`,
  `background`; fonts `display`, `body`; springs `smooth`, `gentle`, `bouncy`,
  `heavy`, `stamp`. The client maps its tokens onto these once, as
  `visualsTheme` in `src/brand/theme.ts`.
- **A blue accent on grey means the provider is missing.** Those are the
  package's neutral defaults; they never ship.
- Every component also takes a partial `theme` prop for a one-off override.

## Components (see INDEX.md for keywords and details)

| Need | Import |
|---|---|
| word-by-word, typewriter, highlight text | `StaggeredWords`, `Typewriter`, `HighlightWord` |
| ambient background | `HexScrollBackground`, `HexGrid`, `FloatingParticles` |
| small animated icon | `ShieldIcon`, `CheckmarkIcon`, `DropIcon`, `ThermometerIcon`, `MinimalIcon` |
| price comparison badge with a scale | `PriceBalanceBadge` |
| product jar with a swapped label and stamp | `CounterfeitLabelJar` |
| Germany map with converging routes | `GermanyDeliveryMap` (+ `DESTINATION_SVG`) |
| globe with a flight path and distance counter | `GlobeFlightPath` (`GlobePoint`) |
| lab bench, test strip, certificate | `LabCertificateReveal` |
| falling coins and a price count-up | `FallingCoinsCounter` |

## After the package changes

Remotion's bundle cache does not notice edits behind the symlink.
`scripts/render.sh` and `scripts/verify.sh` clear it automatically when
`packages/` is newer than the project's stamp; a bare `npx remotion` call
needs `--bundle-cache=false` once. A render that fails with React error #130
after a package edit is this, not your code.

## Storing a new visual

Follow rule 30 (`agents/rules/30-visuals-protocol.md`):

1. New folder under `packages/visuals/src/` with a **technique-based** name
   (`HexGrid`, not a brand motif); export from `src/index.ts`.
2. Colours, fonts, springs via `useVisualsTheme(theme)`; theme-derived
   parameter defaults go in the body (`colorProp ?? colors.accent`), because
   hooks run after the parameter list.
3. Every client-facing text or value is a prop with a neutral default.
4. `_meta.md`: Description, Keywords (technique terms only), Research and key
   prompts, Technical approach, Style adaptation (theme roles), Props, Data
   dependencies. Large data in `data/*.ts` with source and license in the
   header; hand-placed data says so.
5. Row in `packages/visuals/INDEX.md`. Run the leak gate
   (`grep -riE "<client words>" packages/`) — and remember it cannot see hex
   values or substrings inside identifiers.
6. Render a probe still with the default theme and with a partial override,
   then re-verify the client reel that uses it.

## Red flags

- "I'll just copy the component into the project and tweak it."
- "The default colours look fine here." (They are nobody's brand.)
- "The name matches the client's motif, that's clearer." (Names are techniques.)
- "It typechecks, so the render is fine." (Three Phase 6 defects passed tsc.)
