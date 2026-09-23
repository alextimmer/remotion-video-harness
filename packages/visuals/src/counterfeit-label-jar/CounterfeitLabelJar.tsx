import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Animation: glass jar with 3D effect, a second label slides over the original, X-stamp lands
export const CounterfeitLabelJar: React.FC<{
	startFrame: number;
	/** Optional word under the stamp. Omit when the scene subtitle carries the message. */
	stampText?: string;
	/** Text on the label the jar starts with. */
	originalLabel?: string;
	/** Text on the label that slides over it. */
	fakeLabel?: string;
	/** Partial theme override; the provider's theme is used otherwise. */
	theme?: PartialVisualsTheme;
}> = ({
	startFrame,
	stampText,
	originalLabel = 'Original',
	fakeLabel = 'Premium',
	theme,
}) => {
	const {colors, fonts, springs} = useVisualsTheme(theme);
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const elapsed = Math.max(0, frame - startFrame);

	// Jar fade in (frames 0-18)
	const jarOpacity = interpolate(elapsed, [0, 18], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Label slides from right (frames 22-50)
	const labelX = interpolate(elapsed, [22, 50], [320, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.quad),
	});
	const labelOpacity = interpolate(elapsed, [22, 30], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Warning X stamp (frames 60-78)
	const stampSpring = spring({
		fps,
		frame: Math.max(0, elapsed - 60),
		config: springs.stamp,
	});
	const stampScale = interpolate(stampSpring, [0, 1], [2.5, 1]);
	const stampOpacity = elapsed > 60 ? stampSpring : 0;
	const stampRotation = interpolate(stampSpring, [0, 1], [-18, -12]);

	return (
		<div
			style={{
				position: 'relative',
				width: 420,
				height: 500,
				opacity: jarOpacity,
			}}
		>
			<svg width="420" height="420" viewBox="0 0 420 420">
				<defs>
					{/* Glass reflection gradient */}
					<linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor={colors.foreground} stopOpacity="0.05" />
						<stop offset="30%" stopColor={colors.foreground} stopOpacity="0.3" />
						<stop offset="35%" stopColor={colors.foreground} stopOpacity="0.1" />
						<stop offset="100%" stopColor={colors.foreground} stopOpacity="0.02" />
					</linearGradient>
					{/* Liquid gradient */}
					<linearGradient id="liquidFill" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor={colors.accentLight} stopOpacity="0.4" />
						<stop offset="100%" stopColor={colors.accent} stopOpacity="0.6" />
					</linearGradient>
				</defs>

				{/* === Jar body — rounded rectangle with 3D glass effect === */}
				{/* Shadow */}
				<ellipse cx="215" cy="375" rx="90" ry="12" fill={colors.surface} opacity={0.08} />

				{/* Main jar body */}
				<rect
					x="120" y="130" width="180" height="230" rx="22"
					fill={colors.foreground}
					stroke={colors.accent}
					strokeWidth="2.5"
				/>

				{/* Liquid inside (lower portion) */}
				<rect
					x="124" y="210" width="172" height="147" rx="19"
					fill="url(#liquidFill)"
				/>

				{/* Liquid surface wave */}
				<path
					d="M124 210 Q160 200 210 212 Q260 224 296 210"
					fill="none"
					stroke={colors.accent}
					strokeWidth="1.5"
					opacity={0.4}
				/>

				{/* Glass reflection highlight (vertical strip) */}
				<rect
					x="145" y="140" width="30" height="210" rx="15"
					fill="url(#glassShine)"
				/>

				{/* Small reflection dot */}
				<ellipse cx="160" cy="165" rx="8" ry="12" fill={colors.foreground} opacity={0.25} />

				{/* === Jar neck === */}
				<rect
					x="160" y="90" width="100" height="48" rx="6"
					fill={colors.foreground}
					stroke={colors.accent}
					strokeWidth="2"
				/>
				{/* Glass reflection on neck */}
				<rect x="172" y="96" width="12" height="36" rx="6" fill={colors.foreground} opacity={0.2} />

				{/* === Lid — golden cap === */}
				<rect
					x="148" y="70" width="124" height="28" rx="10"
					fill={colors.accent}
				/>
				{/* Lid highlight */}
				<rect
					x="160" y="74" width="60" height="8" rx="4"
					fill={colors.accentLight}
					opacity={0.5}
				/>
				{/* Lid rim */}
				<rect
					x="148" y="92" width="124" height="6" rx="3"
					fill={colors.accentDark}
					opacity={0.5}
				/>

				{/* === Original label === */}
				<rect
					x="140" y="225" width="140" height="70" rx="8"
					fill={colors.foreground}
					stroke={colors.subtle}
					strokeWidth="1.5"
				/>
				{/* Decorative line on label */}
				<line x1="160" y1="248" x2="260" y2="248" stroke={colors.subtle} strokeWidth="0.8" />
				<text
					x="210" y="272"
					textAnchor="middle"
					fontSize="26"
					fontWeight="600"
					fill={colors.muted}
				>
					{originalLabel}
				</text>
			</svg>

			{/* === Second label sliding on === */}
			<div
				style={{
					position: 'absolute',
					top: 225,
					left: 140,
					width: 140,
					height: 70,
					borderRadius: 8,
					backgroundColor: colors.foregroundSoft,
					border: `2.5px solid ${colors.accent}`,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					transform: `translateX(${labelX}px)`,
					opacity: labelOpacity,
					boxShadow: '3px 3px 12px rgba(0,0,0,0.12)',
				}}
			>
				{/* Decorative gold line */}
				<div style={{width: 60, height: 1.5, backgroundColor: colors.accent, opacity: 0.4, marginBottom: 6}} />
				<span
					style={{
						fontFamily: fonts.display,
						fontSize: 24,
						fontWeight: 700,
						color: colors.accentDark,
						letterSpacing: 3,
						textTransform: 'uppercase',
					}}
				>
					{fakeLabel}
				</span>
				<div style={{width: 60, height: 1.5, backgroundColor: colors.accent, opacity: 0.4, marginTop: 6}} />
			</div>

			{/* === Warning X stamp === */}
			<div
				style={{
					position: 'absolute',
					top: 130,
					left: '50%',
					transform: `translateX(-50%) scale(${stampScale}) rotate(${stampRotation}deg)`,
					opacity: stampOpacity,
				}}
			>
				<svg width="170" height="170" viewBox="0 0 170 170">
					{/* Double circle */}
					<circle cx="85" cy="85" r="74" fill="none" stroke={colors.accent} strokeWidth="6" />
					<circle cx="85" cy="85" r="64" fill="none" stroke={colors.accent} strokeWidth="2" opacity={0.4} />
					{/* X */}
					<line x1="48" y1="48" x2="122" y2="122" stroke={colors.accent} strokeWidth="7" strokeLinecap="round" />
					<line x1="122" y1="48" x2="48" y2="122" stroke={colors.accent} strokeWidth="7" strokeLinecap="round" />
				</svg>
			</div>

			{/* Optional stamp label */}
			{stampText && stampOpacity > 0.5 ? (
				<div
					style={{
						position: 'absolute',
						bottom: -5,
						left: '50%',
						transform: 'translateX(-50%)',
						fontFamily: fonts.body,
						fontSize: 30,
						fontWeight: 700,
						color: colors.accent,
						opacity: interpolate(stampOpacity, [0.5, 1], [0, 1]),
						letterSpacing: 4,
						textTransform: 'uppercase',
					}}
				>
					{stampText}
				</div>
			) : null}
		</div>
	);
};
