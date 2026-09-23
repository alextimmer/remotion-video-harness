import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import {spring, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export const CheckmarkIcon: React.FC<{
	delay: number;
	size?: number;
	/** Partial theme override; the provider's theme is used otherwise. */
	theme?: PartialVisualsTheme;
}> = ({
	delay,
	size = 70,
	theme,
}) => {
	const {colors, springs} = useVisualsTheme(theme);
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const entrance = spring({
		fps,
		frame,
		config: springs.bouncy,
		delay,
	});
	const scale = interpolate(entrance, [0, 1], [0, 1]);

	const drawProgress = interpolate(frame, [delay + 5, delay + 18], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				width: size,
				height: size,
				transform: `scale(${scale})`,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<div
				style={{
					width: size * 0.8,
					height: size * 0.8,
					borderRadius: '50%',
					border: `2px solid ${colors.accent}`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<svg
					width={size * 0.4}
					height={size * 0.35}
					viewBox="0 0 24 20"
					fill="none"
				>
					<path
						d="M2 10L9 17L22 3"
						stroke={colors.accent}
						strokeWidth={3}
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeDasharray={30}
						strokeDashoffset={30 * (1 - drawProgress)}
					/>
				</svg>
			</div>
		</div>
	);
};
