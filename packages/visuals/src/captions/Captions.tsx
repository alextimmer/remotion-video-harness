import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import type {VoicePage, VoiceWord} from '../audio/voice-types';

/** One transcribed word with its timing relative to the clip start. */
export type CaptionWord = VoiceWord;

/** One caption "page": what is on screen at once (≤ 2 lines). */
export type CaptionPage = VoicePage;

// Burnt-in captions for muted autoplay. Pages come from the voiceover
// pipeline (whisper word timestamps, paged to ~60 characters); this component
// only decides when a page is visible and which word is current. Words the
// script marked *like this* stay bold and in the accent for the whole page.
// Usually rendered through <Voice scene captions />; direct use is fine too.
export const Captions: React.FC<{
	pages: readonly CaptionPage[];
	/** Frame within the current sequence at which the voice clip starts. */
	offsetFrames?: number;
	/** Distance from the bottom edge; default clears the 420 px platform UI zone. */
	bottom?: number;
	fontSize?: number;
	maxWidth?: number;
	/** Colour the word being spoken in the accent. */
	highlightCurrentWord?: boolean;
	/** Keep a page on screen this long after its last word, to avoid flicker. */
	lingerMs?: number;
	theme?: PartialVisualsTheme;
}> = ({
	pages,
	offsetFrames = 0,
	bottom = 470,
	fontSize = 44,
	maxWidth = 860,
	highlightCurrentWord = true,
	lingerMs = 180,
	theme,
}) => {
	const {colors, fonts} = useVisualsTheme(theme);
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const tMs = ((frame - offsetFrames) / fps) * 1000;

	const page = pages.find((p, i) => {
		const next = pages[i + 1];
		const end = next ? Math.min(p.endMs + lingerMs, next.startMs) : p.endMs + lingerMs;
		return tMs >= p.startMs && tMs < end;
	});
	if (!page) return null;

	// Quick fade at both ends of the page (≈ 4 frames), never a hard pop.
	const fade = (1000 / fps) * 4;
	const opacity = interpolate(
		tMs,
		[page.startMs, page.startMs + fade, page.endMs + lingerMs - fade, page.endMs + lingerMs],
		[0, 1, 1, 0],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
	);

	return (
		<div
			style={{
				// left/right 0 + auto margins + fit-content: an absolutely positioned box
				// at left:50% would shrink-to-fit into the 540 px right of its edge and
				// wrap a 24-character line. zIndex keeps captions above scene content.
				position: 'absolute',
				left: 0,
				right: 0,
				bottom,
				marginLeft: 'auto',
				marginRight: 'auto',
				width: 'fit-content',
				maxWidth,
				zIndex: 1000,
				pointerEvents: 'none',
				padding: '14px 26px',
				borderRadius: 16,
				background: `${colors.background}B8`,
				opacity,
				textAlign: 'center',
				fontFamily: fonts.body,
				fontSize,
				fontWeight: 600,
				lineHeight: 1.25,
				color: colors.foreground,
				whiteSpace: 'normal',
			}}
		>
			{page.words.map((w, i) => {
				const current = highlightCurrentWord && tMs >= w.startMs && tMs < w.endMs;
				const accent = current || w.emphasis;
				return (
					<span key={i} style={{color: accent ? colors.accent : colors.foreground, fontWeight: w.emphasis ? 700 : undefined}}>
						{w.text}
						{i < page.words.length - 1 ? ' ' : ''}
					</span>
				);
			})}
		</div>
	);
};
