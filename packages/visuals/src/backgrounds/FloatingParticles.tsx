import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import {interpolate, useCurrentFrame} from 'remotion';

const PARTICLES = Array.from({length: 10}, (_, i) => ({
	x: 100 + ((i * 137) % 880),
	y: 200 + ((i * 251) % 1520),
	size: 3 + (i % 4),
	speed: 0.3 + (i % 3) * 0.15,
	opacityBase: 0.15 + (i % 3) * 0.1,
}));

export const FloatingParticles: React.FC<{
	/** Partial theme override; the provider's theme is used otherwise. */
	theme?: PartialVisualsTheme;
}> = ({theme}) => {
	const {colors} = useVisualsTheme(theme);
	const frame = useCurrentFrame();

	return (
		<>
			{PARTICLES.map((p, i) => {
				const y = p.y - frame * p.speed;
				const wrappedY = ((y % 1920) + 1920) % 1920;
				const opacity = interpolate(
					Math.sin(frame * 0.05 + i),
					[-1, 1],
					[p.opacityBase * 0.5, p.opacityBase],
				);

				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: p.x,
							top: wrappedY,
							width: p.size,
							height: p.size,
							borderRadius: '50%',
							backgroundColor: colors.accent,
							opacity,
						}}
					/>
				);
			})}
		</>
	);
};
