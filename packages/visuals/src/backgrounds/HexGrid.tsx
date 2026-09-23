import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';

// Fixed hexagon grid — decorative, non-scrolling
export const HexGrid: React.FC<{
	position?: 'top' | 'bottom';
	rows?: number;
	color?: string;
	opacity?: number;
	/** Partial theme override; the provider's theme is used otherwise. */
	theme?: PartialVisualsTheme;
}> = ({
	position = 'bottom',
	rows = 3,
	color: colorProp,
	opacity = 0.06,
	theme,
}) => {
	const {colors} = useVisualsTheme(theme);
	const color = colorProp ?? colors.accent;
	const hexSize = 60;
	const hexWidth = hexSize * 2;
	const hexHeight = hexSize * 1.73;
	const cols = 12;

	const hexagons: {x: number; y: number}[] = [];
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const x = col * hexWidth * 0.75;
			const y = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0);
			hexagons.push({x, y});
		}
	}

	const totalHeight = rows * hexHeight + hexHeight / 2;

	return (
		<div
			style={{
				position: 'absolute',
				left: -hexSize,
				right: 0,
				[position]: 0,
				height: totalHeight,
				overflow: 'hidden',
				opacity,
			}}
		>
			{hexagons.map((hex, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: hex.x,
						top: hex.y,
						width: hexSize * 1.8,
						height: hexSize * 1.8 * 1.15,
						clipPath:
							'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
						backgroundColor: color,
					}}
				/>
			))}
		</div>
	);
};
