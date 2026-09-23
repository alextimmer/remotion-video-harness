# Visual: Text Effects

## Description
Three text animation patterns for Remotion compositions:
1. **Typewriter** — character-by-character reveal
2. **StaggeredWords** — word-by-word fade-in with scale
3. **HighlightWord** — inline wipe-highlight behind a word

## Keywords
Typewriter, text, animation, highlight, stagger, words, reveal, wipe, typing, schreiben

## Research & Key Prompts
- All must be frame-based (no CSS transitions — they don't render in Remotion)
- Typewriter = simple string slice, NOT per-character opacity
- StaggeredWords uses spring per word with incremental delay
- HighlightWord uses scaleX spring on a positioned background div

## Technical Approach
- **Typewriter**: `text.slice(0, Math.floor(elapsed / charFrames))`
- **StaggeredWords**: `text.split(' ')`, each word gets `spring({ delay: startFrame + i * delayPerWord })`
- **HighlightWord**: Absolute-positioned span with `scaleX` transform, origin left

## Style Adaptation Guide
- All accept `style` prop for custom CSS
- Colors passed via props (HighlightWord) or inherited
- Spring configs use damping: 200 (smooth, no bounce)

## Props
- **Typewriter**: `text, startFrame?, charFrames?, style?`
- **StaggeredWords**: `text, startFrame, delayPerWord?, style?`
- **HighlightWord**: `word, color, delay, durationInFrames?`

## Data Dependencies
None — fully self-contained, generic utilities.

## File List
- `Typewriter.tsx` (~20 lines)
- `StaggeredWords.tsx` (~40 lines)
- `HighlightWord.tsx` (~50 lines)
