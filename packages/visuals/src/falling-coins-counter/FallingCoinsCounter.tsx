import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import {Easing, interpolate, useCurrentFrame} from 'remotion';

// Animated price counter spinning up + gold coins falling
export const FallingCoinsCounter: React.FC<{startFrame: number; targetPrice?: number; currency?: string; unitLabel?: string; noteLabel?: string | undefined; theme?: PartialVisualsTheme}> = ({
	startFrame,
	targetPrice = 80,
	currency = '€',
	unitLabel = 'per unit',
	noteLabel,
	theme,
}) => {
	const {colors, fonts} = useVisualsTheme(theme);
	const frame = useCurrentFrame();
	const elapsed = Math.max(0, frame - startFrame);

	// Price counter spins from 0 to 80
	const priceValue = Math.round(
		interpolate(elapsed, [0, 35], [0, targetPrice], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.out(Easing.quad),
		}),
	);

	// Counter opacity
	const counterOpacity = interpolate(elapsed, [0, 8], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Coins falling (6 coins with staggered timing)
	const coins = Array.from({length: 6}, (_, i) => {
		const coinDelay = 3 + i * 5;
		const coinElapsed = Math.max(0, elapsed - coinDelay);
		const coinY = interpolate(coinElapsed, [0, 30], [-100, 500], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.in(Easing.quad),
		});
		const coinOpacity = interpolate(coinElapsed, [0, 5, 25, 30], [0, 1, 1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
		const coinX = 150 + ((i * 137) % 500);
		const coinRotation = coinElapsed * (3 + i * 2);
		return {y: coinY, opacity: coinOpacity, x: coinX, rotation: coinRotation};
	});

	// Price tag shake at the end
	const shakePhase = elapsed > 35 ? Math.sin((elapsed - 35) * 0.8) * 3 : 0;

	return (
		<div style={{position: 'relative', width: 800, height: 500}}>
			{/* Falling coins */}
			{coins.map((coin, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: coin.x,
						top: coin.y,
						width: 50,
						height: 50,
						borderRadius: '50%',
						background: `radial-gradient(circle at 35% 35%, ${colors.accentLight} 0%, ${colors.accent} 55%, ${colors.accentDark} 100%)`,
						border: `3px solid ${colors.accentDark}`,
						boxShadow: `inset 0 -2px 4px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.3), 0 3px 6px rgba(0,0,0,0.15)`,
						opacity: coin.opacity,
						transform: `rotate(${coin.rotation}deg)`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<span
						style={{
							fontFamily: fonts.display,
							fontSize: 24,
							fontWeight: 800,
							color: colors.background,
						}}
					>
						{currency}
					</span>
				</div>
			))}

			{/* Central price display */}
			<div
				style={{
					position: 'absolute',
					top: 100,
					left: '50%',
					transform: `translateX(-50%) rotate(${shakePhase}deg)`,
					opacity: counterOpacity,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				{/* Price tag shape */}
				<div
					style={{
						backgroundColor: colors.foreground,
						border: `4px solid ${colors.accent}`,
						borderRadius: 20,
						padding: '30px 60px',
						display: 'flex',
						alignItems: 'baseline',
						gap: 4,
						boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.15)',
						transform: 'perspective(800px) rotateX(2deg)',
					}}
				>
					<span
						style={{
							fontFamily: fonts.display,
							fontSize: 120,
							fontWeight: 800,
							color: colors.surface,
						}}
					>
						{priceValue}
					</span>
					<span
						style={{
							fontFamily: fonts.display,
							fontSize: 60,
							fontWeight: 700,
							color: colors.accent,
						}}
					>
						{currency}
					</span>
				</div>
				<div
					style={{
						fontFamily: fonts.body,
						fontSize: 36,
						fontWeight: 500,
						color: colors.muted,
						marginTop: 16,
					}}
				>
					{unitLabel}
				</div>
				{noteLabel ? (
					<div
						style={{
							fontFamily: fonts.body,
							fontSize: 28,
							fontWeight: 500,
							color: colors.muted,
							marginTop: 4,
							opacity: 0.7,
						}}
					>
						{noteLabel}
					</div>
				) : null}
			</div>
		</div>
	);
};
