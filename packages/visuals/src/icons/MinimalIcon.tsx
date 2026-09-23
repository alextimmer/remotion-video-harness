import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';

export type MinimalIconVariant = 'euro' | 'distance' | 'warning' | 'location' | 'check' | 'seal';

// Six line-art glyphs on a 48x48 grid, drawn in the accent colour.
const iconPaths = (accent: string): Record<MinimalIconVariant, React.ReactNode> => ({
	euro: (
		<text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle"
			fontSize="28" fontWeight="700" fill={accent}>€</text>
	),
	distance: (
		<>
			<line x1="12" y1="24" x2="36" y2="24" stroke={accent} strokeWidth="2.5" />
			<polygon points="34,20 40,24 34,28" fill={accent} />
			<circle cx="10" cy="24" r="3" fill={accent} />
		</>
	),
	warning: (
		<>
			<line x1="24" y1="14" x2="24" y2="26" stroke={accent} strokeWidth="3" strokeLinecap="round" />
			<circle cx="24" cy="32" r="2" fill={accent} />
		</>
	),
	location: (
		<>
			<circle cx="24" cy="20" r="6" fill="none" stroke={accent} strokeWidth="2.5" />
			<circle cx="24" cy="20" r="2.5" fill={accent} />
			<path d="M24 28 L24 36" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
		</>
	),
	check: (
		<path d="M14 24 L21 31 L34 16" fill="none" stroke={accent}
			strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
	),
	seal: (
		<>
			<circle cx="24" cy="24" r="10" fill="none" stroke={accent} strokeWidth="2" />
			<path d="M18 24 L22 28 L30 20" fill="none" stroke={accent}
				strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
		</>
	),
});

export const MinimalIcon: React.FC<{
	variant: MinimalIconVariant;
	size?: number;
	/** Ring colour; the accent when omitted. */
	borderColor?: string;
	/** Partial theme override; the provider's theme is used otherwise. */
	theme?: PartialVisualsTheme;
}> = ({variant, size = 80, borderColor, theme}) => {
	const {colors} = useVisualsTheme(theme);
	const ring = borderColor ?? colors.accent;
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: '50%',
				border: `2px solid ${ring}`,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexShrink: 0,
			}}
		>
			<svg width={size * 0.6} height={size * 0.6} viewBox="0 0 48 48">
				{iconPaths(colors.accent)[variant]}
			</svg>
		</div>
	);
};
