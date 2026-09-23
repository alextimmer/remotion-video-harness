// Theme contract for @harness/visuals.
//
// Every component in this package draws its colours, fonts and spring presets
// from a VisualsTheme. The names are roles, not brand terms, so the package
// never carries a client's palette. A client fulfils the contract once in its
// src/brand/theme.ts and hands it to <VisualsThemeProvider> at the root of each
// reel; a component may also take a partial `theme` prop for a one-off override.
//
// The defaults below are deliberately nobody's brand: a plain blue accent on
// dark grey with system fonts. They exist so a component renders sensibly in
// isolation (Studio, tests, spike stills), not to be shipped.
import React, {createContext, useContext, useMemo} from 'react';
import type {SpringConfig} from 'remotion';

export type VisualsColors = {
	/** Primary brand accent: badges, lines, highlighted text, icon strokes. */
	accent: string;
	/** Lighter tint of the accent: highlights, gradient tops, coin faces. */
	accentLight: string;
	/** Darker shade of the accent: gradient bottoms, shadows, depth. */
	accentDark: string;
	/** Primary text and shapes on a dark background. */
	foreground: string;
	/** Softer text: small labels, captions on badges. */
	foregroundSoft: string;
	/** Secondary text: subtitles, units, de-emphasised copy. */
	muted: string;
	/** Faint lines, struck-through prices, disabled states. */
	subtle: string;
	/** Raised dark surfaces: cards, seals, jar bodies. */
	surface: string;
	/** Deepest background. */
	background: string;
};

export type VisualsFonts = {
	display: string;
	body: string;
};

export type VisualsSprings = {
	smooth: Partial<SpringConfig>;
	gentle: Partial<SpringConfig>;
	bouncy: Partial<SpringConfig>;
	heavy: Partial<SpringConfig>;
	stamp: Partial<SpringConfig>;
};

export type VisualsTheme = {
	colors: VisualsColors;
	fonts: VisualsFonts;
	springs: VisualsSprings;
};

/** A partial theme for overrides: any subset of any group. */
export type PartialVisualsTheme = {
	colors?: Partial<VisualsColors>;
	fonts?: Partial<VisualsFonts>;
	springs?: Partial<VisualsSprings>;
};

export const DEFAULT_VISUALS_THEME: VisualsTheme = {
	colors: {
		accent: '#4F8EF7',
		accentLight: '#8DB6FF',
		accentDark: '#2B5DB8',
		foreground: '#F4F4F5',
		foregroundSoft: '#E4E4E7',
		muted: '#A1A1AA',
		subtle: '#71717A',
		surface: '#1C1C21',
		background: '#0E0E11',
	},
	fonts: {
		display: 'sans-serif',
		body: 'sans-serif',
	},
	springs: {
		smooth: {damping: 200},
		gentle: {damping: 200, stiffness: 80},
		bouncy: {damping: 10},
		heavy: {damping: 18, stiffness: 60, mass: 2},
		stamp: {damping: 14, stiffness: 150},
	},
};

export const mergeTheme = (
	base: VisualsTheme,
	override?: PartialVisualsTheme,
): VisualsTheme =>
	override
		? {
				colors: {...base.colors, ...override.colors},
				fonts: {...base.fonts, ...override.fonts},
				springs: {...base.springs, ...override.springs},
			}
		: base;

const ThemeContext = createContext<VisualsTheme>(DEFAULT_VISUALS_THEME);

export const VisualsThemeProvider: React.FC<{
	theme: PartialVisualsTheme;
	children: React.ReactNode;
}> = ({theme, children}) => {
	const parent = useContext(ThemeContext);
	const value = useMemo(() => mergeTheme(parent, theme), [parent, theme]);
	return React.createElement(ThemeContext.Provider, {value}, children);
};

/**
 * The theme in effect for a component: the nearest provider's theme (or the
 * neutral defaults), with an optional per-component override merged on top.
 */
export const useVisualsTheme = (override?: PartialVisualsTheme): VisualsTheme => {
	const fromContext = useContext(ThemeContext);
	return useMemo(() => mergeTheme(fromContext, override), [fromContext, override]);
};
