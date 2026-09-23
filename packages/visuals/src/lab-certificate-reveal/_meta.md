# Visual: Lab certificate reveal

## Description
An abstract laboratory bench — no human figure. A wide-mouthed jar of liquid slides up; a test strip is pulled out of it, drips fall back, and the strip's reaction zone changes colour and glows. A small beaker and a test-tube rack frame the bench. Then a certificate card slides up from below with a round seal in its corner, a title, a subtitle, a footer line and a checkmark that draws itself.

## Keywords
laboratory, bench, jar, test strip, indicator, colour change, glow, drips, certificate, seal, checkmark, stroke draw, feDropShadow, infographic

## Research and key prompts
- **Do not draw people in SVG.** A stick-figure scientist always looks bad; the abstract bench-and-reaction scene reads as "lab" instantly.
- The certificate must appear early (elapsed ≈ 30–55) to be on screen long enough — roughly two seconds at 30 fps. Earlier versions showed it too briefly.
- Process animations of this kind need to be **longer and more prominent** than a first attempt suggests: the strip pull, the drips and the colour change each want their own beat (pull 12–37, colour 25–40, glow 35–45).
- Light 3D: `feDropShadow` on the jar group, a glass-reflection gradient on the jar, a gradient background plus stronger box shadow on the card.
- The issuing party has to be legible: `footer` in `muted` under the main text.
- Checkmark via `strokeDasharray` / `strokeDashoffset`, driven by a spring.

## Technical approach
- Scene fades in over 10 frames; jar slides up with the `gentle` spring (frames 4–14).
- Strip Y interpolates from submerged (0) to pulled out (−95) over frames 12–37; three staggered drops fall with quadratic gravity easing.
- Indicator: RGB interpolation from the accent to a contrasting hue over frames 25–40, then a glow filter pulses (35–45).
- Liquid surface wobbles while the strip moves (sine on the pull progress).
- Certificate: HTML card, `gentle` spring slide-up from elapsed 30; seal badge absolutely positioned in the top-right corner; checkmark path draws 50–70.

## Style adaptation
- Jar outline, bench, strip body, card accents, seal: `accent`; liquid gradient: `accentLight → accent`; shadow tones: `accentDark`; card: `foreground`; secondary text: `muted`.
- Heading uses `fonts.display`, body and footer `fonts.body`.
- Constants for jar geometry and strip travel are at the top of the file if a different bench layout is needed.

## Props
`startFrame`, `sealText?` (`'LAB'`), `title?` (`'Certificate'`), `subtitle?` (`'Quality verified'`), `footer?` (`'lab.example'`), `theme?`

## Data dependencies
None.
