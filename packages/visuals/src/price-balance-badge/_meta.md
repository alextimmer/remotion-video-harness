# Visual: Price balance badge

## Description
A solid circular badge with a balance scale inside, like a quality seal. The scale tilts toward the heavy side, then levels. Curved text runs around the top rim. Below the badge an optional caption, then two prices side by side: the compared one struck through, the own one larger and growing at the end.

## Keywords
badge, seal, balance scale, scales, comparison, price, strikethrough, curved text, textPath, two-colour

## Research and key prompts
- Pans must be **semicircles** (SVG arc `A r r 0 0 0 x y`), not ellipses — ellipses read as bowls.
- Chains from beam to pan converge downward into a **V**, forming a triangle with the pan rim; parallel chains look mechanical.
- Exactly two colours inside the badge: the accent fill and the foreground for every scale element. Any third colour breaks the seal look.
- The own price is bold and grows slightly at the end (`scale 1 → 1.15–1.2`) so the eye lands there last.
- The caption needs to appear early (elapsed ≈ 42) and stay, or it is never read.

## Technical approach
- Badge: `<circle>` with accent fill and an inner ring at lower opacity.
- Curved text: `<textPath>` on an arc path anchored at the badge top.
- Balance: `<g transform="rotate(tiltAngle)">` around the fulcrum; tilt eases quadratically 20° → 0°.
- Two emphasis presets bundle label size, price size, growth factor and timing: `subtle` (24/52, ×1.15, until 80) and `strong` (28/72, ×1.2, until 85).

## Style adaptation
- Badge fill and price text: theme role `accent`. Scale elements and badge text: `foreground`.
- Price numbers use `fonts.display`, labels `fonts.body`.
- Badge size constant `S` in the file if a different scale is needed.

## Props
`startFrame`, `badgeText?` (`'FAIR PRICES'`), `leftLabel?` (`'Import'`), `leftPrice?` (`'60 €'`), `rightLabel?` (`'Regional'`), `rightPrice?` (`'12 €'`), `caption?` (none), `priceEmphasis?` (`'subtle' | 'strong'`, default `'strong'`), `theme?`

## Data dependencies
None.
