# Visual: Falling coins counter

## Description
Six coins with a 3D radial gradient fall from above with staggered timing. A price tag in the centre counts up from zero to a target value and shakes when it lands. A unit line and an optional note sit underneath.

## Keywords
coins, falling, radial gradient, 3D, counter, count-up, price tag, shake, stagger, easing, currency

## Research and key prompts
- Coins need a `<radialGradient>` with three stops (light centre → accent → dark rim) to read as metal; flat circles read as dots.
- Staggered fall (5-frame intervals) gives a cascade; all-at-once looks like a glitch.
- The counter should ease quadratically — slow start, fast middle, slow settle — so the final number is readable.
- A sine-wave rotation shake on the tag at the end adds urgency without a spring bounce.

## Technical approach
- Coins: SVG circles with gradient fill; Y position via quadratic gravity easing from each coin's start frame; opacity fades in and out.
- Counter: `Math.round(interpolate(elapsed, [0, 35], [0, targetPrice]))`.
- Tag: CSS `perspective(800px) rotateX(2deg)` for depth; shake `Math.sin(elapsed · f) · a` on rotation.

## Style adaptation
- Coin gradient stops: `accentLight` / `accent` / `accentDark`; coin glyph: `background`; tag: `foreground` card with `surface` number and `accent` currency; unit and note: `muted`.
- Number uses `fonts.display`, unit and note `fonts.body`.

## Props
`startFrame`, `targetPrice?` (`80`), `currency?` (`'€'`), `unitLabel?` (`'per unit'`), `noteLabel?` (none), `theme?`

## Data dependencies
None.
