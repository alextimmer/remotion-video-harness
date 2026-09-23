# Visual: Globe flight path

## Description
A 3D orthographic globe with recognisable continents. An airplane follows the great-circle arc between two points, leaving a dashed trail; markers and labels sit at both ends. A distance counter runs up underneath, with a caption.

## Keywords
globe, earth, sphere, orthographic projection, great circle, geodesic, haversine, flight path, airplane, distance counter, coastlines, 3D shading

## Research and key prompts
- Use **orthographic** projection, never equirectangular inside a circle — the latter looks flat and wrong; orthographic compresses continents toward the rim like a real sphere.
- The shortest route is the **great circle**, not a straight line on a flat map; spherical interpolation shows the real arc (a NZ→Europe flight bows over the Indian Ocean).
- Continents as `[lat, lon][]` coordinate arrays projected per frame, never hand-drawn SVG paths.
- Two colours only: `foreground` ocean, `accent` land. A grey globe reads as a placeholder.
- Cull the back hemisphere: render a point only when `cosC > −0.05`.
- Grid lines must be projected polylines too, or they cut straight across the sphere.
- The viewing centre matters: `CENTER_LAT = 15°, CENTER_LON = 60°` shows Europe left and the south-west Pacific right with India in the middle. Change these constants for other routes.

## Technical approach
- Projection: `x = R·cos(lat)·sin(lon − cLon)`, `y = −R·(cos(cLat)·sin(lat) − sin(cLat)·cos(lat)·cos(lon − cLon))`.
- Visibility: `cosC = sin(cLat)·sin(lat) + cos(cLat)·cos(lat)·cos(lon − cLon)`.
- Geodesic: spherical slerp between the two points in 60 steps, projected each frame; plane angle from consecutive points.
- Shading: radial gradient overlay (upper-left highlight, rim darkening) plus an atmosphere glow filter.
- Grid and trail as `<polyline>` so hidden points can simply be filtered out.

## Style adaptation
- Land, markers, trail, plane and counter: `accent`; ocean: `foreground`; caption: `muted`; text: `fonts.body`.
- Route via `from` / `to` (lat, lon, marker label); counter target via `distanceKm`; number formatting via `distanceLabel`.

## Props
`startFrame`, `from?` (`{lat: -41, lon: 174, label: 'A'}`), `to?` (`{lat: 51, lon: 10, label: 'B'}`), `distanceKm?` (`12000`), `distanceLabel?` (`km => \`${km.toLocaleString('en-US')} km\``), `caption?` (`'Halfway around the globe'`), `captionFontSize?` (`46`; the caption is one line and 500 px wide is not a limit — pass a smaller size when a long caption would enter the frame's right UI zone), `theme?`

## Data dependencies
- `data/globe-coastline-data.ts` — 19 `[lat, lon][]` arrays (Europe, British Isles, Ireland, Africa, Madagascar, Asia mainland, India, Sri Lanka, Japan, Australia, Tasmania, NZ North/South, Borneo, Sumatra, Java, Sulawesi, Papua, Philippines).
- Provenance: hand-placed approximations by an agent (2026-04), from no external dataset — no third-party license applies. Decorative accuracy only. Natural Earth 110m (public domain) would be a drop-in upgrade in the same array format.
