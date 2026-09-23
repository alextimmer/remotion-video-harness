# Craft rules for short-form vertical video (Reels, Shorts, TikTok)

These hold for every client. Brand values come from the client theme file.

## Readability on phones

- Body text at least 40px, headlines 60 to 120px at 1080x1920.
- Keep headlines under roughly 110px when the font is wide; test the longest word for overflow.
- Slower is better. Every text must be readable twice before it leaves.
- Icons are SVG or CSS, never emoji (emoji render inconsistently and ignore the palette).

## Safe zones (1080x1920)

Platform UI covers parts of the frame. Keep essential text and logos out of:
top ~250px (status bar, account name), bottom ~420px (caption, controls),
right ~120px (action buttons). Verify against the current platform overlay when
in doubt; Remotion Studio offers a social safe-zone overlay.

## Motion, audio, legal

Motion rules are in `21-craft-motion.md`, audio and captions in
`22-craft-audio.md`, the food-advertising checklist in `23-craft-legal-food.md`.
The short version: gentle springs, no linear easing, stagger, exits faster
than entrances, timing from `fps` — and no silent deliverable.

## Verification

- Before claiming a scene is done, render stills at key frames and look at them.
- Check text overflow, safe zones, layer order and contrast on the actual pixels.
