# Visual: Germany delivery map

## Description
Accurate outline of Germany with all sixteen state borders. Three delivery routes from different directions converge on a destination point; moving dots travel along them and the destination pulses. One state can be emphasised. A large distance label and a caption sit under the map.

## Keywords
map, Germany, states, borders, SVG path, routes, convergence, delivery, logistics, regional, pulse, moving dots

## Research and key prompts
- Hand-drawn outlines of a country are always wrong. Use real border data (`@svg-maps/germany`, CC BY 4.0) and let the viewBox do the scaling.
- `preserveAspectRatio="xMidYMid meet"` is essential; without it the map distorts whenever the container's aspect differs from the viewBox.
- Routes from **three directions** (SW, SE, N) read as "from all around"; a single route reads as A→B.
- Static dashed lines do not convey motion — animate a dot slightly ahead of each line's growing end.
- The emphasised state gets a higher fill opacity (0.35 vs 0.15–0.20) and a thicker stroke, ramped in over ~10 frames.
- Keep the container taller than the SVG so the text below never overlaps the map.

## Technical approach
- Sixteen `<path>`s from the data file, viewBox `0 0 586 793`.
- Routes start staggered (elapsed 25 / 30 / 35); line end and dot interpolate from source to destination with quadratic-out easing.
- Destination pulse: sine-driven radius on two rings.

## Style adaptation
- State fills, routes, dots and the distance label: `accent`; caption: `muted`; text: `fonts.body`.
- Move the destination with `destination` (viewBox coordinates); pick the emphasised state with its two-letter id via `highlightState`.
- Source offsets are relative to the destination, so moving it keeps the composition.

## Props
`startFrame`, `destination?` (`DESTINATION_SVG`, a north-western point), `highlightState?` (none), `distanceLabel?` (`'~50 km'`), `caption?` (`'Short distances.'`), `theme?`

## Data dependencies
- `data/germany-map-data.ts` — `GERMANY_STATES` (16 states with ids and paths), `GERMANY_VIEWBOX`, `DESTINATION_SVG`. Simplified to ~27 KB.
- `data/germany-map-data-full.ts` — same shape at full detail (~69 KB) for large renders; not imported by default.
- Source: `@svg-maps/germany` (github.com/VictorCazanave/svg-maps), derived from MapSVG. License CC BY 4.0; the attribution in the file headers satisfies it.
