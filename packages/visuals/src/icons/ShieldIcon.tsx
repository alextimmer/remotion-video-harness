import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const ShieldIcon: React.FC<{
	delay: number;
	size?: number;
	/** Partial theme override; the provider's theme is used otherwise. */
	theme?: PartialVisualsTheme;
}> = ({
	delay,
	size = 180,
	theme,
}) => {
	const {colors, springs} = useVisualsTheme(theme);
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const entrance = spring({
		fps,
		frame,
		config: springs.heavy,
		delay,
	});

	const scale = interpolate(entrance, [0, 1], [0, 1]);

	// Pulse rings
	const pulseFrame = Math.max(0, frame - delay - 20);
	const ring1Scale = interpolate(pulseFrame % 35, [0, 35], [1, 2.5]);
	const ring1Opacity = interpolate(pulseFrame % 35, [0, 35], [0.5, 0]);
	const ring2Scale = interpolate((pulseFrame + 17) % 35, [0, 35], [1, 2.5]);
	const ring2Opacity = interpolate((pulseFrame + 17) % 35, [0, 35], [0.5, 0]);

	const showPulse = frame > delay + 20;

	return (
		<div
			style={{
				position: 'relative',
				width: size,
				height: size * 1.2,
				transform: `scale(${scale})`,
			}}
		>
			{showPulse && (
				<>
					<div
						style={{
							position: 'absolute',
							inset: -25,
							borderRadius: '50%',
							border: `2px solid ${colors.accent}`,
							opacity: ring1Opacity,
							transform: `scale(${ring1Scale})`,
						}}
					/>
					<div
						style={{
							position: 'absolute',
							inset: -25,
							borderRadius: '50%',
							border: `2px solid ${colors.accent}`,
							opacity: ring2Opacity,
							transform: `scale(${ring2Scale})`,
						}}
					/>
				</>
			)}
			<div
				style={{
					width: '100%',
					height: '100%',
					clipPath:
						'polygon(50% 0%, 100% 10%, 100% 65%, 50% 100%, 0% 65%, 0% 10%)',
					background: `linear-gradient(180deg, ${colors.accent}55, ${colors.accent}88)`,
					border: `3px solid ${colors.accent}`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<div
					style={{
						width: '88%',
						height: '88%',
						clipPath:
							'polygon(50% 0%, 100% 10%, 100% 65%, 50% 100%, 0% 65%, 0% 10%)',
						border: `2px solid ${colors.accent}AA`,
					}}
				/>
			</div>
		</div>
	);
};
