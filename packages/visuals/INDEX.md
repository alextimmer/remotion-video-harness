# @harness/visuals — index

Reusable Remotion components, brand-neutral, themed through the contract in
`src/theme.ts`. **Check here before building any animation.** Each folder has a
`_meta.md` with the research behind it, the technical approach and adaptation
notes. Import from `@harness/visuals`; never copy files.

```tsx
import {VisualsThemeProvider, PriceBalanceBadge} from '@harness/visuals';
// once per reel:  <VisualsThemeProvider theme={visualsTheme}> … </VisualsThemeProvider>
```

| Folder | Exports | Keywords | One line |
|---|---|---|---|
| `text-effects` | `Typewriter`, `StaggeredWords`, `HighlightWord` | typewriter, stagger, word reveal, highlight wipe | Frame-based text entrances: character slice, spring per word, scaleX wipe behind a word. |
| `backgrounds` | `HexScrollBackground`, `HexGrid`, `FloatingParticles` | hexagon, hex grid, tessellation, particles, ambient | Subtle dark-scene layers: scrolling hexagons, fixed hex grid at an edge, drifting particles. |
| `icons` | `ShieldIcon`, `CheckmarkIcon`, `DropIcon`, `ThermometerIcon`, `MinimalIcon` | shield, checkmark, drop, thermometer, glyph, pulse ring | Spring-entrance icons; `MinimalIcon` has six line-art variants in a ring. |
| `price-balance-badge` | `PriceBalanceBadge` | badge, balance scale, comparison, strikethrough, curved text | Solid badge with a tilting scale, rim text, and two prices — compared struck through, own emphasised. |
| `counterfeit-label-jar` | `CounterfeitLabelJar` | jar, glass 3D, label swap, counterfeit, X-stamp | Glass jar; a second label slides over the original; double-ring stamp springs in. |
| `germany-delivery-map` | `GermanyDeliveryMap`, `DESTINATION_SVG`, `GERMANY_VIEWBOX` | map, Germany, state borders, routes, convergence, regional | Accurate 16-state map; three routes with moving dots converge on a pulsing destination. |
| `globe-flight-path` | `GlobeFlightPath`, `GlobePoint` | globe, orthographic, great circle, geodesic, flight, distance counter | 3D globe with real coastlines; plane follows the great-circle arc; counter runs up. |
| `lab-certificate-reveal` | `LabCertificateReveal` | laboratory, flask, pipette, certificate, seal, checkmark | Abstract lab reaction, then a certificate slides up with a seal and a self-drawing checkmark. |
| `falling-coins-counter` | `FallingCoinsCounter` | coins, count-up, price tag, shake, radial gradient | Six 3D coins fall; a tag counts to a target and shakes on landing. |
| `captions` | `Captions`, `CaptionPage`, `CaptionWord` | captions, subtitles, burnt-in, word highlight, emphasis, muted autoplay | Pages from whisper timestamps on a plate above the UI zone; current word in the accent, `*emphasised*` words bold. Usually rendered via `<Voice subtitles />`. |
| `audio` | `Voice`, `VoiceProvider`, `useVoice`, `deriveVoiceTiming`, `VoiceIndex`, `voiceFrames`, `MusicBed`, `DuckWindow` | voiceover, script, voice index, scene timing, music, bed, ducking, fade | One `<Voice scene="…"/>` per scene plays the clip from the generated voice index (and optionally its captions); `deriveVoiceTiming` turns designed lengths + voice index into scene starts, total length and duck windows; `MusicBed` is a looping bed ducked under speech. |

## Theme roles

Every component draws from `VisualsTheme` (see `src/theme.ts`): colours
`accent`, `accentLight`, `accentDark`, `foreground`, `foregroundSoft`, `muted`,
`subtle`, `surface`, `background`; fonts `display`, `body`; springs `smooth`,
`gentle`, `bouncy`, `heavy`, `stamp`. A client maps its brand tokens onto these
once, in its `src/brand/theme.ts`. Defaults are deliberately nobody's brand.

## Adding a visual

Rule 30 in `agents/rules/30-visuals-protocol.md`: new folder under `src/`,
technique-based name, every client-specific text or value as a prop with a
neutral default, `_meta.md`, export from `src/index.ts`, row in this table.
Large geometry goes in `data/` with source and license in the file header.
