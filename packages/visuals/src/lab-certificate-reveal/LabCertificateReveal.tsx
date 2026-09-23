import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Lab scene: jar + test strip pulled out → certificate
export const LabCertificateReveal: React.FC<{
	startFrame: number;
	/** Footer line, e.g. the issuing lab. */
	footer?: string;
	/** Text in the round seal on the certificate corner. */
	sealText?: string;
	/** Certificate heading. */
	title?: string;
	/** Line under the heading. */
	subtitle?: string;
	/** Partial theme override; the provider's theme is used otherwise. */
	theme?: PartialVisualsTheme;
}> = ({
	startFrame,
	footer = 'lab.example',
	sealText = 'LAB',
	title = 'Certificate',
	subtitle = 'Quality verified',
	theme,
}) => {
	const {colors, fonts, springs} = useVisualsTheme(theme);
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const elapsed = Math.max(0, frame - startFrame);

	// Scene fade in (faster: 0-10)
	const sceneOpacity = interpolate(elapsed, [0, 10], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Jar slides up (frames 4-14)
	const jarSpring = spring({
		fps,
		frame: Math.max(0, elapsed - 4),
		config: springs.gentle,
	});
	const jarY = interpolate(jarSpring, [0, 1], [30, 0]);

	// Test strip pull-out (frames 12-37): strip moves upward
	const stripPull = interpolate(elapsed, [12, 37], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.quad),
	});
	// Strip Y offset: 0 = submerged, -95 = fully pulled out
	const stripY = interpolate(stripPull, [0, 1], [0, -95]);

	// Liquid drips falling off strip (3 drops, staggered)
	const drips = [
		{delay: 20, x: -2, speed: 1.0},
		{delay: 25, x: 3, speed: 1.3},
		{delay: 30, x: -1, speed: 0.9},
	].map(d => {
		const dripElapsed = Math.max(0, elapsed - d.delay);
		const dripY = interpolate(dripElapsed, [0, 18], [0, 60], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.in(Easing.quad),
		});
		const dripOpacity = interpolate(dripElapsed, [0, 3, 14, 18], [0, 0.8, 0.6, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
		return {y: dripY, opacity: dripOpacity, x: d.x};
	});

	// Indicator color change on strip (gold → blue, frames 25-40)
	const colorProgress = interpolate(elapsed, [25, 40], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const indR = Math.round(200 + colorProgress * (50 - 200));
	const indG = Math.round(150 + colorProgress * (120 - 150));
	const indB = Math.round(12 + colorProgress * (220 - 12));

	// Indicator glow pulse (frames 35-45)
	const glowPulse = interpolate(elapsed, [35, 40, 45], [0, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Certificate slides up (frames 30-55)
	const certSpring = spring({
		fps,
		frame: Math.max(0, elapsed - 30),
		config: springs.gentle,
	});
	const certY = interpolate(certSpring, [0, 1], [120, 0]);

	// Checkmark on certificate (frames 50-70)
	const checkProgress = interpolate(elapsed, [50, 70], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Liquid surface wobble when strip pulls
	const wobble = elapsed >= 14 && elapsed <= 42
		? Math.sin((elapsed - 14) * 0.5) * 2 * (1 - stripPull)
		: 0;

	return (
		<div
			style={{
				position: 'relative',
				width: 480,
				height: 580,
				opacity: sceneOpacity,
			}}
		>
			{/* Lab equipment SVG */}
			<svg width="480" height="280" viewBox="0 0 480 280">
				<defs>
					{/* 3D shadow for jar */}
					<filter id="jarShadow" x="-10%" y="-5%" width="130%" height="120%">
						<feDropShadow dx="3" dy="5" stdDeviation="5" floodColor={colors.accentDark} floodOpacity="0.18" />
					</filter>
					{/* Glass reflection */}
					<linearGradient id="jarGlass" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor={colors.foreground} stopOpacity="0.0" />
						<stop offset="20%" stopColor={colors.foreground} stopOpacity="0.25" />
						<stop offset="28%" stopColor={colors.foreground} stopOpacity="0.05" />
						<stop offset="100%" stopColor={colors.foreground} stopOpacity="0.0" />
					</linearGradient>
					{/* Liquid gradient */}
					<linearGradient id="liquidFill" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stopColor={colors.accentLight} stopOpacity="0.6" />
						<stop offset="100%" stopColor={colors.accent} stopOpacity="0.8" />
					</linearGradient>
					{/* Indicator glow */}
					<filter id="indicatorGlow">
						<feGaussianBlur stdDeviation="4" />
					</filter>
				</defs>

				{/* Lab bench surface */}
				<rect x="40" y="245" width="400" height="8" rx="3" fill={colors.accent} opacity={0.4} />
				<ellipse cx="240" cy="254" rx="180" ry="6" fill={colors.accentDark} opacity={0.08} />

				{/* === Jar (center) === */}
				<g filter="url(#jarShadow)" transform={`translate(0, ${jarY})`} opacity={jarSpring}>
					{/* Jar body — wide-mouthed container */}
					<path
						d="M175 160 L165 240 Q162 250 178 250 L302 250 Q318 250 315 240 L305 160 Z"
						fill="none"
						stroke={colors.accent}
						strokeWidth="3"
						strokeLinejoin="round"
					/>
					{/* Jar rim */}
					<rect x="168" y="152" width="144" height="12" rx="6" fill="none" stroke={colors.accent} strokeWidth="2.5" />

					{/* Liquid inside jar */}
					<path
						d={`M170 ${178 + wobble} Q200 ${175 + wobble} 240 ${177 + wobble} Q280 ${175 + wobble} 310 ${178 + wobble} L315 240 Q318 250 302 250 L178 250 Q162 250 165 240 Z`}
						fill="url(#liquidFill)"
					/>

					{/* Glass reflection on jar */}
					<rect x="178" y="165" width="22" height="75" rx="10" fill="url(#jarGlass)" />

					{/* === Test Strip === */}
					<g transform={`translate(240, ${195 + stripY})`}>
						{/* Strip body */}
						<rect x="-7" y="-20" width="14" height="110" rx="3"
							fill={colors.foreground} stroke={colors.subtle} strokeWidth="1.5" />

						{/* Handle/grip area at top */}
						<rect x="-9" y="-25" width="18" height="12" rx="2"
							fill={colors.subtle} opacity={0.5} />

						{/* Reaction zone at bottom of strip */}
						<rect x="-5" y="60" width="10" height="25" rx="2"
							fill={`rgb(${indR}, ${indG}, ${indB})`}
							opacity={0.9}
						/>

						{/* Glow effect on indicator */}
						{glowPulse > 0 && (
							<rect x="-8" y="57" width="16" height="31" rx="4"
								fill={`rgb(${indR}, ${indG}, ${indB})`}
								opacity={glowPulse * 0.4}
								filter="url(#indicatorGlow)"
							/>
						)}
					</g>

					{/* Liquid drips falling from strip */}
					{drips.map((drip, i) =>
						drip.opacity > 0 ? (
							<circle
								key={i}
								cx={240 + drip.x}
								cy={195 + stripY + 90 + drip.y}
								r={3.5}
								fill={colors.accent}
								opacity={drip.opacity}
							/>
						) : null
					)}
				</g>

				{/* Small beaker on left */}
				<rect x="60" y="215" width="45" height="35" rx="4" fill="none" stroke={colors.accent} strokeWidth="2" opacity={0.5} />
				<rect x="57" y="210" width="51" height="8" rx="3" fill="none" stroke={colors.accent} strokeWidth="1.5" opacity={0.4} />
				<rect x="63" y="232" width="39" height="15" rx="3" fill={colors.accent} opacity={0.15} />

				{/* Test tube rack on right */}
				<rect x="370" y="220" width="60" height="6" rx="2" fill={colors.accent} opacity={0.4} />
				<rect x="378" y="190" width="10" height="36" rx="4" fill="none" stroke={colors.accent} strokeWidth="1.5" opacity={0.4} />
				<rect x="395" y="195" width="10" height="31" rx="4" fill="none" stroke={colors.accent} strokeWidth="1.5" opacity={0.4} />
				<rect x="412" y="185" width="10" height="41" rx="4" fill="none" stroke={colors.accent} strokeWidth="1.5" opacity={0.4} />
			</svg>

			{/* Certificate (slides up — taller, bigger text) */}
			{elapsed > 30 && (
				<div
					style={{
						position: 'absolute',
						bottom: 0,
						left: '50%',
						transform: `translateX(-50%) translateY(${certY}px) perspective(1000px) rotateX(3deg)`,
						opacity: certSpring,
						width: 460,
						height: 280,
						backgroundColor: colors.foreground,
						border: `3px solid ${colors.accent}`,
						borderRadius: 14,
						padding: '24px 28px',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.1), 0 20px 50px rgba(0,0,0,0.12)',
						background: `linear-gradient(175deg, ${colors.foreground} 0%, #F8F6F0 100%)`,
					}}
				>
					{/* Seal decoration */}
					<div
						style={{
							position: 'absolute',
							top: -24,
							right: -24,
							width: 60,
							height: 60,
							borderRadius: '50%',
							backgroundColor: colors.accent,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
						}}
					>
						<div
							style={{
								fontFamily: fonts.body,
								fontSize: 18,
								fontWeight: 800,
								color: colors.foreground,
							}}
						>
							{sealText}
						</div>
					</div>

					<div
						style={{
							fontFamily: fonts.display,
							fontSize: 38,
							fontWeight: 800,
							color: colors.accent,
							textTransform: 'uppercase',
							letterSpacing: 6,
						}}
					>
						{title}
					</div>
					<div
						style={{
							width: 200,
							height: 2,
							backgroundColor: colors.accent,
							opacity: 0.4,
							marginTop: 12,
							marginBottom: 12,
						}}
					/>
					<div
						style={{
							fontFamily: fonts.body,
							fontSize: 28,
							fontWeight: 500,
							color: colors.muted,
						}}
					>
						{subtitle}
					</div>
					<div
						style={{
							fontFamily: fonts.body,
							fontSize: 24,
							fontWeight: 500,
							color: colors.muted,
							marginTop: 6,
							opacity: 0.7,
						}}
					>
						{footer}
					</div>
					{/* Animated checkmark */}
					<svg
						width="64"
						height="50"
						viewBox="0 0 64 50"
						style={{marginTop: 14}}
					>
						<path
							d="M8 25 L24 41 L56 8"
							fill="none"
							stroke={colors.accent}
							strokeWidth="5"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeDasharray={72}
							strokeDashoffset={72 * (1 - checkProgress)}
						/>
					</svg>
				</div>
			)}
		</div>
	);
};
