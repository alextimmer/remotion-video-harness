import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import {spring, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export const ThermometerIcon: React.FC<{
	delay: number;
	size?: number;
	/** Reading shown under the bulb. */
	label?: string;
	/** Partial theme override; the provider's theme is used otherwise. */
	theme?: PartialVisualsTheme;
}> = ({
	delay,
	size = 70,
	label = '<40°C',
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

	const fillProgress = interpolate(frame, [delay + 5, delay + 25], [0, 0.75], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const tubeWidth = size * 0.25;
	const tubeHeight = size * 0.8;
	const bulbSize = size * 0.4;

	return (
		<div
			style={{
				width: size,
				height: size * 1.3,
				transform: `scale(${scale})`,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'flex-end',
			}}
		>
			{/* Tube */}
			<div
				style={{
					width: tubeWidth,
					height: tubeHeight,
					borderRadius: tubeWidth / 2,
					border: `2px solid ${colors.accent}`,
					position: 'relative',
					overflow: 'hidden',
					marginBottom: -bulbSize * 0.3,
					zIndex: 1,
				}}
			>
				<div
					style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						height: `${fillProgress * 100}%`,
						backgroundColor: colors.accent,
						borderRadius: tubeWidth / 2,
					}}
				/>
			</div>
			{/* Bulb */}
			<div
				style={{
					width: bulbSize,
					height: bulbSize,
					borderRadius: '50%',
					border: `2px solid ${colors.accent}`,
					backgroundColor: fillProgress > 0 ? colors.accent : 'transparent',
					zIndex: 0,
				}}
			/>
			{/* Label */}
			<div
				style={{
					fontSize: 14,
					color: colors.foregroundSoft,
					marginTop: 6,
					fontWeight: 500,
				}}
			>
				{label}
			</div>
		</div>
	);
};
