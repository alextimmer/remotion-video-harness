import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const StaggeredWords: React.FC<{
	text: string;
	startFrame: number;
	delayPerWord?: number;
	style?: React.CSSProperties;
}> = ({text, startFrame, delayPerWord = 8, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const words = text.split(' ');

	return (
		<span style={style}>
			{words.map((word, i) => {
				const delay = startFrame + i * delayPerWord;
				const progress = spring({
					fps,
					frame,
					config: {damping: 200},
					delay,
					durationInFrames: 15,
				});
				const opacity = progress;
				const scale = interpolate(progress, [0, 1], [0.8, 1]);

				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							opacity,
							transform: `scale(${scale})`,
							marginRight: '0.3em',
						}}
					>
						{word}
					</span>
				);
			})}
		</span>
	);
};
