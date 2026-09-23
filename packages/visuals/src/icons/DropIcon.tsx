import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import {spring, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export const DropIcon: React.FC<{
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

	return (
		<div
			style={{
				width: size,
				height: size * 1.3,
				transform: `scale(${scale})`,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<div
				style={{
					width: size * 0.7,
					height: size * 1.1,
					background: `linear-gradient(180deg, ${colors.accent}, ${colors.accent}CC)`,
					borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
				}}
			/>
		</div>
	);
};
