# Visual: Background layers

## Description
Three ambient layers for dark compositions:
1. **HexScrollBackground** — eleven hexagons scrolling upward at different speeds, wrapping at composition height.
2. **HexGrid** — a fixed, tessellated hexagon grid anchored to the top or bottom edge.
3. **FloatingParticles** — ten small particles drifting upward with opacity pulsing.

## Keywords
background, hexagon, hex grid, tessellation, particles, ambient, decoration, shimmer, scroll, clipPath

## Research and key prompts
- Hexagons are CSS `clipPath: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)` on a div — no SVG needed.
- Scrolling hexagons wrap with modulo on composition height so the loop never shows a seam.
- The grid alternates row offsets by half a cell for a true tessellation.
- Particle positions are deterministic (index-based, no `Math.random`) so every render is identical.
- All three are meant to stay subtle: opacity 0.04–0.10.

## Technical approach
- Frame-driven translation via `useCurrentFrame()`; speeds differ per hexagon index.
- `HexGrid` computes rows × columns from `rows` and the hex size, positions absolutely.
- `FloatingParticles` pulses opacity with a sine on the frame plus a per-particle phase.

## Style adaptation
- Colour comes from the theme role `accent` unless a `color` prop is passed.
- `opacity` per scene: 0.04 for a whisper, 0.10 when the layer should read.
- `HexGrid` takes `position: 'top' | 'bottom'` and `rows`.

## Props
- **HexScrollBackground**: `color?`, `opacity?`, `theme?`
- **HexGrid**: `position?`, `rows?`, `color?`, `opacity?`, `theme?`
- **FloatingParticles**: `theme?`

## Data dependencies
None.
