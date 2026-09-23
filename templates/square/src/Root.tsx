import React from 'react';
import {Composition} from 'remotion';
import {MainComp} from './MainComp';

// Square: 1080x1080 (1:1), 30fps
// Adjust durationInFrames: 30 frames = 1 second

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="MainComp"
				component={MainComp}
				durationInFrames={300}
				fps={30}
				width={1080}
				height={1080}
			/>
		</>
	);
};
