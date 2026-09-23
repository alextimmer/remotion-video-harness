import React from 'react';
import {Composition} from 'remotion';
import {MainComp} from './MainComp';

// Landscape 1080p: 1920x1080 (16:9), 30fps
// Adjust durationInFrames: 30 frames = 1 second

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="MainComp"
				component={MainComp}
				durationInFrames={300}
				fps={30}
				width={1920}
				height={1080}
			/>
		</>
	);
};
