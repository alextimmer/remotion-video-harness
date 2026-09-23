# Visual: Icon components

## Description
Five small animated icons with spring entrances:
1. **ShieldIcon** — shield silhouette with two staggered pulse rings (protection).
2. **CheckmarkIcon** — a checkmark drawing itself inside a ring.
3. **DropIcon** — teardrop / liquid drop silhouette.
4. **ThermometerIcon** — tube and bulb filling up, with a reading underneath.
5. **MinimalIcon** — six line-art glyphs in a ring: `euro`, `distance`, `warning`, `location`, `check`, `seal`.

## Keywords
icon, shield, checkmark, drop, thermometer, glyph, minimal, SVG, symbol, pulse ring, stroke draw

## Research and key prompts
- Shield shape via CSS `clipPath: polygon(...)`; the pulse rings are two absolutely positioned circles on a 35-frame cycle, offset by half a cycle.
- Checkmark draws with `strokeDasharray` / `strokeDashoffset` driven by a spring — not opacity.
- Glyphs are 48×48 inline SVG so they stay crisp at any `size`.
- Every icon enters with a spring (`bouncy` by default, `heavy` for the shield) — never a linear fade.

## Technical approach
- `spring({fps, frame, delay, config})` for entrance scale; `interpolate` for ring expansion and opacity.
- Thermometer fill height interpolates on the frame after the entrance.

## Style adaptation
- Stroke and fill colour is the theme role `accent`; `MinimalIcon` also accepts `borderColor` for the ring.
- Entrance springs come from the theme's `springs`.
- All take `size`.

## Props
- **ShieldIcon**: `delay`, `size?`, `theme?`
- **CheckmarkIcon**: `delay`, `size?`, `theme?`
- **DropIcon**: `delay`, `size?`, `theme?`
- **ThermometerIcon**: `delay`, `size?`, `label?` (default `'<40°C'`), `theme?`
- **MinimalIcon**: `variant`, `size?`, `borderColor?`, `theme?`

## Data dependencies
None.
