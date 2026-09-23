import React from 'react';
import {Composition} from 'remotion';
import {MainComp} from './MainComp';

// Instagram Reel: 1080x1920 (9:16), 30fps
// Adjust durationInFrames: 30 frames = 1 second

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="MainComp"
				component={MainComp}
				durationInFrames={540}
				fps={30}
				width={1080}
				height={1920}
			/>
		</>
	);
};
