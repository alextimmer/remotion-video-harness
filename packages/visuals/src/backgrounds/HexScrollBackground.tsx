import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import {useCurrentFrame} from 'remotion';

const HEXAGONS = [
	{x: 120, y: 300, size: 90, speed: 0.15},
	{x: 880, y: 600, size: 70, speed: 0.2},
	{x: 250, y: 1000, size: 110, speed: 0.1},
	{x: 780, y: 1500, size: 55, speed: 0.18},
	{x: 500, y: 150, size: 80, speed: 0.12},
	{x: 950, y: 1100, size: 100, speed: 0.16},
	{x: 60, y: 1600, size: 65, speed: 0.14},
];

export const HexScrollBackground: React.FC<{
	color?: string;
	opacity?: number;
	/** Partial theme override; the provider's theme is used otherwise. */
	theme?: PartialVisualsTheme;
}> = ({
	color: colorProp,
	opacity = 0.08,
	theme,
}) => {
	const {colors} = useVisualsTheme(theme);
	const color = colorProp ?? colors.accent;
	const frame = useCurrentFrame();

	return (
		<>
			{HEXAGONS.map((hex, i) => {
				const y = hex.y - frame * hex.speed;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: hex.x - hex.size / 2,
							top: y,
							width: hex.size,
							height: hex.size * 1.15,
							clipPath:
								'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
							backgroundColor: color,
							opacity,
						}}
					/>
				);
			})}
		</>
	);
};
