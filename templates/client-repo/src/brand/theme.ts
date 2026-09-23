// Brand theme — the single source of brand values for this client.
// Prose rules (agents/rules/10-brand.md) reference this file; they never
// repeat the values. Every value here comes from the client, never from an
// agent. Fill the OPEN: markers, then state where the values came from:
//
// Source: OPEN: who confirmed these values, and when (e.g. "client brand
//         guide v3, confirmed by <name> on <date>")
//
// The placeholders below are deliberately nobody's brand (grey on grey) so an
// unfinished theme is visible in every render, not mistaken for a design.
import type {VisualsTheme} from '@harness/visuals';

// Brand palette — name the colours the way the client does. OPEN: replace.
export const COLOR = {
	background: '#111111', // OPEN: deepest background
	surface: '#1E1E1E', // OPEN: raised surfaces (cards, seals)
	text: '#EDEDED', // OPEN: primary text on dark
	textSoft: '#D6D6D6', // OPEN: softer text (small labels)
	muted: '#9A9A9A', // OPEN: secondary text
	subtle: '#5C5C5C', // OPEN: faint lines, struck-through prices
	accent: '#7A7A7A', // OPEN: primary brand accent
	accentLight: '#A3A3A3', // OPEN: lighter tint of the accent
	accentDark: '#4D4D4D', // OPEN: darker shade of the accent
} as const;

// Fonts — load the real ones (e.g. @remotion/google-fonts) and export the
// resolved family names. OPEN: replace.
export const FONT_DISPLAY = 'sans-serif';
export const FONT_BODY = 'sans-serif';

// Spring presets — motion character is a brand value too. Start gentle;
// the craft rules prefer smooth over bouncy.
export const SPRING = {
	smooth: {damping: 200},
	gentle: {damping: 200, stiffness: 80},
	bouncy: {damping: 10},
	heavy: {damping: 18, stiffness: 60, mass: 2},
	stamp: {damping: 14, stiffness: 150},
} as const;

// Format — set by the chosen template (insta-reel 1080x1920, landscape 1920x1080, square 1080x1080).
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Fulfilment of the @harness/visuals theme contract: brand tokens mapped onto
// the package's role names. Wrap each reel's root in
// <VisualsThemeProvider theme={visualsTheme}>; without it the package renders
// its own neutral defaults.
export const visualsTheme: VisualsTheme = {
	colors: {
		accent: COLOR.accent,
		accentLight: COLOR.accentLight,
		accentDark: COLOR.accentDark,
		foreground: COLOR.text,
		foregroundSoft: COLOR.textSoft,
		muted: COLOR.muted,
		subtle: COLOR.subtle,
		surface: COLOR.surface,
		background: COLOR.background,
	},
	fonts: {display: FONT_DISPLAY, body: FONT_BODY},
	springs: SPRING,
};
