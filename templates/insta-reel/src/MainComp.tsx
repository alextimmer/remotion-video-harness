import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {StaggeredWords} from '@harness/visuals';

export const MainComp: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const titleSpring = spring({fps, frame, config: {damping: 200}});
	const titleOpacity = titleSpring;
	const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

	return (
		<AbsoluteFill
			style={{
				background: 'linear-gradient(180deg, #1a1a2e, #16213e)',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 60,
			}}
		>
			<div
				style={{
					fontSize: 80,
					fontWeight: 700,
					color: '#ffffff',
					textAlign: 'center',
					opacity: titleOpacity,
					transform: `translateY(${titleY}px)`,
				}}
			>
				Your Title Here
			</div>
			<StaggeredWords
				text="Shared visuals package"
				startFrame={20}
				style={{
					fontSize: 44,
					color: '#ffffff',
					textAlign: 'center',
					marginTop: 40,
				}}
			/>
		</AbsoluteFill>
	);
};
