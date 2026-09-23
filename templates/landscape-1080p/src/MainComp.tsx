import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

export const MainComp: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const titleSpring = spring({fps, frame, config: {damping: 200}});
	const titleOpacity = titleSpring;
	const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

	return (
		<AbsoluteFill
			style={{
				background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 80,
			}}
		>
			<div
				style={{
					fontSize: 72,
					fontWeight: 700,
					color: '#ffffff',
					textAlign: 'center',
					opacity: titleOpacity,
					transform: `translateY(${titleY}px)`,
				}}
			>
				Your Title Here
			</div>
		</AbsoluteFill>
	);
};
