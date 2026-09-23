import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import {Easing, interpolate, useCurrentFrame} from 'remotion';

// Fair Price badge — matches reference: solid gold circle, white scale with
// semicircle pans and V-chain connections. Only 2 colors: foreground + accent.
const EMPHASIS = {
	// "subtle" is the smaller, gentler treatment; "strong" makes the own price dominant.
	subtle: {labelSize: 24, priceSize: 52, scale: 1.15, until: 80},
	strong: {labelSize: 28, priceSize: 72, scale: 1.2, until: 85},
} as const;

export const PriceBalanceBadge: React.FC<{
	startFrame: number;
	/** Compared price, struck through. */
	leftPrice?: string;
	/** Own price, emphasised. */
	rightPrice?: string;
	/** Caption above the prices. Omit to leave it out (the scene subtitle may carry it). */
	caption?: string;
	/** How much the own price is played up. */
	priceEmphasis?: keyof typeof EMPHASIS;
	/** Curved text on the badge rim. */
	badgeText?: string;
	/** Name over the compared (struck-through) price. */
	leftLabel?: string;
	/** Name over the own (emphasised) price. */
	rightLabel?: string;
	/** Partial theme override; the provider's theme is used otherwise. */
	theme?: PartialVisualsTheme;
}> = ({
	startFrame,
	leftPrice = '60 €',
	rightPrice = '12 €',
	caption,
	priceEmphasis = 'strong',
	badgeText = 'FAIR PRICES',
	leftLabel = 'Import',
	rightLabel = 'Regional',
	theme,
}) => {
	const {colors, fonts} = useVisualsTheme(theme);
	const emphasis = EMPHASIS[priceEmphasis];
	const frame = useCurrentFrame();
	const elapsed = Math.max(0, frame - startFrame);

	// Badge fade in (frames 0-18)
	const badgeOpacity = interpolate(elapsed, [0, 18], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Scale tilts then balances (frames 12-50)
	const tiltAngle = interpolate(elapsed, [12, 50], [20, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.quad),
	});

	// "Ehrliche Preise." text (frames 42-55)
	const ehrlichOpacity = interpolate(elapsed, [42, 55], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Price labels — own price earlier and bolder
	const leftPriceOpacity = interpolate(elapsed, [50, 60], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const rightPriceOpacity = interpolate(elapsed, [55, 65], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// Own price grows at the end for emphasis
	const rightPriceScale = interpolate(elapsed, [65, emphasis.until], [1, emphasis.scale], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const S = 360; // badge diameter
	const cx = S / 2;
	const cy = S / 2;
	const R = S / 2 - 4;

	// Scale dimensions (inside the circle)
	const beamHalf = 85; // half-length of the horizontal beam
	const pillarH = 55; // pillar height from base to beam
	const chainH = 40; // vertical height of the V-chains
	const panR = 32; // radius of the semicircular pans

	return (
		<div
			style={{
				position: 'relative',
				width: 500,
				height: 520,
				opacity: badgeOpacity,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
			}}
		>
			<svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
				{/* Solid gold circle */}
				<circle cx={cx} cy={cy} r={R} fill={colors.accent} />

				{/* Curved badge text at top — foreground on accent */}
				<defs>
					<path
						id="fairArc"
						d={`M ${cx - R + 45} ${cy - 10} A ${R - 45} ${R - 45} 0 0 1 ${cx + R - 45} ${cy - 10}`}
					/>
				</defs>
				<text
					fontSize="34"
					fontWeight="800"
					fill={colors.foreground}
					letterSpacing="5"
				>
					<textPath href="#fairArc" startOffset="50%" textAnchor="middle">
						{badgeText}
					</textPath>
				</text>

				{/* === Balance scale — all white === */}
				<g transform={`translate(${cx}, ${cy + 20})`}>
					{/* Base */}
					<rect x="-35" y={pillarH + 2} width="70" height="10" rx="5" fill={colors.foreground} />

					{/* Pillar */}
					<rect x="-5" y={-10} width="10" height={pillarH + 12} rx="3" fill={colors.foreground} />

					{/* Beam (tilts) */}
					<g transform={`rotate(${tiltAngle} 0 -10)`}>
						{/* Horizontal beam */}
						<rect x={-beamHalf} y={-14} width={beamHalf * 2} height="8" rx="4" fill={colors.foreground} />

						{/* === Left pan (compared side) === */}
						{/* V-chains: two lines from beam end converging down to pan attachment */}
						<line x1={-beamHalf} y1={-6} x2={-beamHalf + 12} y2={chainH - 6} stroke={colors.foreground} strokeWidth="2.5" />
						<line x1={-beamHalf} y1={-6} x2={-beamHalf - 12} y2={chainH - 6} stroke={colors.foreground} strokeWidth="2.5" />
						{/* Left pan: semicircle (open top, curved bottom) */}
						<path
							d={`M ${-beamHalf - panR} ${chainH - 6} A ${panR} ${panR} 0 0 0 ${-beamHalf + panR} ${chainH - 6}`}
							fill="none"
							stroke={colors.foreground}
							strokeWidth="3"
							strokeLinecap="round"
						/>
						{/* Rim line connecting the two top edges */}
						<line
							x1={-beamHalf - panR} y1={chainH - 6}
							x2={-beamHalf + panR} y2={chainH - 6}
							stroke={colors.foreground}
							strokeWidth="2"
						/>

						{/* === Right pan (own side) === */}
						<line x1={beamHalf} y1={-6} x2={beamHalf + 12} y2={chainH - 6} stroke={colors.foreground} strokeWidth="2.5" />
						<line x1={beamHalf} y1={-6} x2={beamHalf - 12} y2={chainH - 6} stroke={colors.foreground} strokeWidth="2.5" />
						<path
							d={`M ${beamHalf - panR} ${chainH - 6} A ${panR} ${panR} 0 0 0 ${beamHalf + panR} ${chainH - 6}`}
							fill="none"
							stroke={colors.foreground}
							strokeWidth="3"
							strokeLinecap="round"
						/>
						<line
							x1={beamHalf - panR} y1={chainH - 6}
							x2={beamHalf + panR} y2={chainH - 6}
							stroke={colors.foreground}
							strokeWidth="2"
						/>

						{/* Small fulcrum triangle at center */}
						<polygon points="-8,-14 8,-14 0,-26" fill={colors.foreground} />
					</g>
				</g>
			</svg>

			{/* Optional caption between badge and prices */}
			{caption ? (
				<div
					style={{
						fontFamily: fonts.display,
						fontSize: 48,
						fontWeight: 700,
						color: colors.accent,
						opacity: ehrlichOpacity,
						textAlign: 'center',
						marginTop: 16,
						letterSpacing: 2,
					}}
				>
					{caption}
				</div>
			) : null}

			{/* Price comparison below badge */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					gap: 60,
					marginTop: 20,
				}}
			>
				<div style={{textAlign: 'center'}}>
					<div style={{fontFamily: fonts.body, fontSize: 24, fontWeight: 500, color: colors.accent, opacity: leftPriceOpacity}}>
						{leftLabel}
					</div>
					<div style={{fontFamily: fonts.display, fontSize: 44, fontWeight: 700, color: colors.accent, opacity: leftPriceOpacity, textDecoration: 'line-through'}}>
						{leftPrice}
					</div>
				</div>
				<div style={{textAlign: 'center'}}>
					<div style={{fontFamily: fonts.body, fontSize: emphasis.labelSize, fontWeight: 600, color: colors.accent, opacity: rightPriceOpacity}}>
						{rightLabel}
					</div>
					<div style={{fontFamily: fonts.display, fontSize: emphasis.priceSize, fontWeight: 800, color: colors.accent, opacity: rightPriceOpacity, transform: `scale(${rightPriceScale})`, transformOrigin: 'center'}}>
						{rightPrice}
					</div>
				</div>
			</div>
		</div>
	);
};
