import React from 'react';
import {Audio, interpolate, useVideoConfig} from 'remotion';

/** A span of composition time (milliseconds from frame 0) during which speech plays. */
export type DuckWindow = {startMs: number; endMs: number};

// A music bed for the whole composition, ducked under speech. Volume is a pure
// function of the frame, so Studio and render agree and the mix is
// deterministic. Levels are linear gains on the source; master the final MP4
// with scripts/master.sh to hit the loudness target.
export const MusicBed: React.FC<{
	src: string;
	/** Speech windows to duck under; take them from the voice index. */
	duckWindows?: readonly DuckWindow[];
	/** Gain outside speech. */
	bedVolume?: number;
	/** Gain under speech (8–12 dB below the bed sounds right: ×0.25–0.4). */
	duckVolume?: number;
	/** Ramp length for ducking in and out. */
	rampMs?: number;
	/** Fade-in at the start and fade-out at the end. */
	fadeInMs?: number;
	fadeOutMs?: number;
	/** Offset into the music file, if it should not start at 0. */
	startFromFrames?: number;
	loop?: boolean;
}> = ({
	src,
	duckWindows = [],
	bedVolume = 0.35,
	duckVolume = 0.1,
	rampMs = 300,
	fadeInMs = 800,
	fadeOutMs = 1500,
	startFromFrames = 0,
	loop = true,
}) => {
	const {fps, durationInFrames} = useVideoConfig();
	const totalMs = (durationInFrames / fps) * 1000;

	const volume = (f: number) => {
		const t = (f / fps) * 1000;
		// duck factor: 1 outside speech, 0 inside, ramped
		let duck = 1;
		for (const w of duckWindows) {
			const v = interpolate(
				t,
				[w.startMs - rampMs, w.startMs, w.endMs, w.endMs + rampMs],
				[1, 0, 0, 1],
				{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
			);
			duck = Math.min(duck, v);
		}
		const level = duckVolume + (bedVolume - duckVolume) * duck;
		const fadeIn = interpolate(t, [0, fadeInMs], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
		const fadeOut = interpolate(t, [totalMs - fadeOutMs, totalMs], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
		return Math.max(0, Math.min(1, level * fadeIn * fadeOut));
	};

	return <Audio src={src} volume={volume} startFrom={startFromFrames} loop={loop} />;
};
