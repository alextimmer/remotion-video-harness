import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {GERMANY_STATES, DESTINATION_SVG} from './data/germany-map-data';

// Accurate Germany map with all 16 state borders + delivery routes converging on a destination
export const GermanyDeliveryMap: React.FC<{startFrame: number; destination?: {x: number; y: number}; highlightState?: string | undefined; distanceLabel?: string; caption?: string; theme?: PartialVisualsTheme}> = ({
	startFrame,
	destination = DESTINATION_SVG,
	highlightState,
	distanceLabel = '~50 km',
	caption = 'Short distances.',
	theme,
}) => {
	const {colors, fonts} = useVisualsTheme(theme);
	const frame = useCurrentFrame();
	const elapsed = Math.max(0, frame - startFrame);

	// Map fade in (frames 0-20)
	const mapOpacity = interpolate(elapsed, [0, 20], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// NRW highlight (frames 15-25)
	const highlightProgress = interpolate(elapsed, [15, 25], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Delivery routes draw from 3 directions (frames 25-60)
	const route1Progress = interpolate(elapsed, [25, 52], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.quad),
	});
	const route2Progress = interpolate(elapsed, [30, 55], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.quad),
	});
	const route3Progress = interpolate(elapsed, [35, 58], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.quad),
	});

	// Destination pulse — earlier
	const pulsePhase = elapsed > 48 ? (elapsed - 48) * 0.12 : 0;
	const pulseRadius = 8 + Math.sin(pulsePhase) * 3;

	// Distance label — show EARLIER so it's readable before phase exits
	const distOpacity = interpolate(elapsed, [36, 48], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Source points (3 nearby origins around the destination)
	const mx = destination.x;
	const my = destination.y;
	const sources = [
		{x: mx - 35, y: my + 55, label: ''},   // Southwest
		{x: mx + 45, y: my + 30, label: ''},   // Southeast
		{x: mx - 10, y: my - 50, label: ''},   // North
	];

	return (
		<div style={{position: 'relative', width: 370, height: 600, opacity: mapOpacity}}>
			<svg
				width="370"
				height="480"
				viewBox="0 0 586 793"
				preserveAspectRatio="xMidYMid meet"
			>
				{/* All 16 Bundesländer */}
				{GERMANY_STATES.map((state) => {
					const isHighlighted = state.id === highlightState;
					const fillOpacity = isHighlighted
						? interpolate(highlightProgress, [0, 1], [0.15, 0.35])
						: 0.2;

					return (
						<path
							key={state.id}
							d={state.path}
							fill={colors.accent}
							fillOpacity={fillOpacity}
							stroke={colors.accent}
							strokeWidth={isHighlighted ? 2.5 : 1.2}
							strokeOpacity={isHighlighted ? 0.9 : 0.5}
						/>
					);
				})}

				{/* Delivery routes from 3 directions to the destination */}
				{[route1Progress, route2Progress, route3Progress].map((progress, i) => {
					const src = sources[i];
					const lineEndX = src.x + (mx - src.x) * progress;
					const lineEndY = src.y + (my - src.y) * progress;

					// Moving dot position (slightly ahead of line end)
					const dotProgress = Math.min(1, progress * 1.05);
					const dotX = src.x + (mx - src.x) * dotProgress;
					const dotY = src.y + (my - src.y) * dotProgress;

					return (
						<React.Fragment key={i}>
							{/* Source dot */}
							<circle cx={src.x} cy={src.y} r="5" fill={colors.accent} opacity={0.4} />
							{/* Route line (dashed) */}
							<line
								x1={src.x}
								y1={src.y}
								x2={lineEndX}
								y2={lineEndY}
								stroke={colors.accent}
								strokeWidth="4"
								strokeLinecap="round"
								strokeDasharray="10 6"
								opacity={0.6}
							/>
							{/* Moving delivery dot */}
							{progress > 0.05 && progress < 0.98 && (
								<circle
									cx={dotX}
									cy={dotY}
									r="8"
									fill={colors.accent}
									opacity={0.9}
								/>
							)}
						</React.Fragment>
					);
				})}

				{/* Destination — pulsing */}
				<circle cx={mx} cy={my} r={pulseRadius} fill={colors.accent} />
				{elapsed > 48 && (
					<>
						<circle
							cx={mx} cy={my}
							r={pulseRadius + 14 + Math.sin(pulsePhase) * 5}
							fill="none" stroke={colors.accent} strokeWidth="2.5" opacity={0.35}
						/>
						<circle
							cx={mx} cy={my}
							r={pulseRadius + 28 + Math.sin(pulsePhase + 1) * 5}
							fill="none" stroke={colors.accent} strokeWidth="1.5" opacity={0.15}
						/>
					</>
				)}
			</svg>

			{/* Distance label + subtitle */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: '50%',
					transform: 'translateX(-50%)',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 4,
					opacity: distOpacity,
				}}
			>
				<div
					style={{
						fontFamily: fonts.body,
						fontSize: 42,
						fontWeight: 700,
						color: colors.accent,
						whiteSpace: 'nowrap',
					}}
				>
					{distanceLabel}
				</div>
				<div
					style={{
						fontFamily: fonts.body,
						fontSize: 46,
						fontWeight: 500,
						color: colors.muted,
						whiteSpace: 'nowrap',
					}}
				>
					{caption}
				</div>
			</div>
		</div>
	);
};
