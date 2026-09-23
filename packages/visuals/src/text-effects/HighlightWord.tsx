import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const HighlightWord: React.FC<{
	word: string;
	color: string;
	delay: number;
	durationInFrames?: number;
}> = ({word, color, delay, durationInFrames = 18}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const progress = spring({
		fps,
		frame,
		config: {damping: 200},
		delay,
		durationInFrames,
	});
	const scaleX = Math.max(0, Math.min(1, progress));

	return (
		<span style={{position: 'relative', display: 'inline-block'}}>
			<span
				style={{
					position: 'absolute',
					left: -4,
					right: -4,
					top: '50%',
					height: '1.1em',
					transform: `translateY(-50%) scaleX(${scaleX})`,
					transformOrigin: 'left center',
					backgroundColor: color,
					borderRadius: '0.15em',
					zIndex: 0,
				}}
			/>
			<span style={{position: 'relative', zIndex: 1}}>{word}</span>
		</span>
	);
};
