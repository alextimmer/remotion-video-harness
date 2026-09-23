# Craft: motion

Holds for every client. Spring presets and colours come from the client theme
(`visualsTheme`); these rules say how to use them. Numbers are for 30 fps and
are starting points — slower is almost always the better correction.

## Spring vocabulary

Use the theme's five presets by meaning, not by taste of the moment:

| Preset | Character | Use for |
|---|---|---|
| `smooth` | damping 200, no overshoot | text entrances, opacity, most things |
| `gentle` | damping 200, stiffness 80 | large elements, cards, slow reveals |
| `heavy` | mass 2, slow settle | badges, seals, objects with weight |
| `stamp` | quick, slight overshoot | impacts: stamps, checkmarks landing |
| `bouncy` | visible overshoot | small icons only, never text or layout |

Damping ≥ 200 means no bounce. A professional reel uses `smooth`/`gentle`
for nearly everything and one `stamp` per scene at most.

## Entrances and exits

- Never a single linear property. Entrances combine opacity with a small
  translate (20–40 px) or scale (0.9 → 1). Exits combine opacity with a small
  move in the direction of travel.
- Entrance 12–20 frames; exit 8–12 frames. **Exits are faster than entrances.**
- Stagger anything that is a list: words 6–10 frames apart, items 8–12,
  never everything at once. `StaggeredWords` from the visuals package does
  this for text.
- One thing moves at a time. If two elements must enter together, they share
  one spring.

## Hold times — "readable twice"

A text stays long enough to be read twice at phone pace, about 15 characters
per second:

```
hold_frames ≥ 2 × (characters ÷ 15) × fps
```

A 40-character line therefore holds ≥ 160 frames (5.3 s) at 30 fps. Headlines
of 1–3 words hold ≥ 60 frames. When a scene feels long in Studio, it is
usually right; when it feels snappy, it is too fast for a viewer who did not
write it.

## Idle micro-motion

Nothing on screen is fully static for more than ~2 s. Give held elements a
slow drift, a soft glow pulse or ambient layers behind them (`FloatingParticles`,
`HexScrollBackground`). Keep amplitudes tiny: 2–4 px, opacity ±0.05.

## Layer stack

Build every scene bottom-up in five layers, each its own component:

1. background (theme `background`)
2. ambient (hex grid, particles — opacity 0.04–0.10)
3. content (text, illustrations, animations)
4. accents (highlights, badges, stamps)
5. CTA / persistent elements (logo, hashtag)

Absolute-positioned layers make stills easy to check for layer order.

## Transitions and duration

- Scenes live in a `TransitionSeries`; use `fade()` or `wipe()` at 12–15
  frames. Overlay transitions (`TransitionSeries.Overlay`, light leaks) only
  when the brand look allows them.
- Composition length = sum of scene durations − sum of transition overlaps.
  Keep `DURATION_FRAMES` and `SCENE_DURATION` in the reel's `timing.ts` and
  assert that they agree; a mismatch shows as a frozen or black tail.
- All timing derives from `fps` via `useVideoConfig()`. No hard-coded seconds.

## Determinism and performance

- No `Math.random()`: positions and delays come from the index or a seeded
  function, or every render differs.
- Fonts load through `@remotion/google-fonts` (the theme exports the resolved
  family); a system-font fallback in a render is a bug.
- Expensive SVG filters (`feDropShadow`, blur) once per element, not per
  frame-generated node; hundreds of filtered nodes make renders crawl.

## Failure checklist (check before verify)

emoji icons · system fonts · linear easing · everything entering at once ·
static hold > 2 s · duration mismatch · text overflow at the longest word ·
hard-coded seconds · `Math.random` · silent video (see `22-craft-audio.md`) ·
unthemed package defaults (a blue accent means the provider is missing)

## Verifying motion with stills

Pick frames at entrance mid-point (+8), full hold, and exit start. Compute
the composition frame as `scene start − transition overlap + offset in scene`.
Frame 60 shows only the hook; every scene a change touches needs its own frame.
