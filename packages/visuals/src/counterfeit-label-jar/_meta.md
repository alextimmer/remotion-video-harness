# Visual: Counterfeit label jar

## Description
A glass jar with 3D reflections and liquid inside, wearing an original label. A second label slides on from the right and covers it; a double-ring X-stamp springs in with rotation. An optional word appears under the stamp.

## Keywords
jar, glass, 3D, gradient reflection, label swap, counterfeit, warning stamp, X-stamp, slide-in, spring

## Research and key prompts
- The 3D read comes from a vertical `<linearGradient>` highlight strip of varying white opacity plus a soft ellipse shadow under the jar — not from drawn outlines.
- A "modern" jar means a detailed lid (highlight strip and rim), a wavy liquid surface and decorative rules on the labels.
- The stamp needs a **double circle** (outer solid, inner thin) for visual weight; a single ring looks like a placeholder.
- Stamp landing: spring on scale 2.5 → 1 with rotation −18° → −12° reads as a physical stamp.

## Technical approach
- Liquid: two-stop gradient `accentLight → accent`; surface as a quadratic Bézier across the jar width.
- Label slide: `translateX()` interpolation with quadratic-out easing.
- Stamp: `spring` with the theme's `stamp` config on `scale()` + `rotate()`.

## Style adaptation
- Liquid: `accentLight` / `accent`; label text: `accentDark`; glass and labels: `foreground` / `foregroundSoft`; jar outlines: `subtle` / `muted`.
- Label text uses `fonts.display`, the stamp word `fonts.body`.

## Props
`startFrame`, `originalLabel?` (`'Original'`), `fakeLabel?` (`'Premium'`), `stampText?` (none — omit when the scene subtitle carries the message), `theme?`

## Data dependencies
None.
