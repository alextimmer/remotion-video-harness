import React from 'react';
import {useVisualsTheme, type PartialVisualsTheme} from '../theme';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {
	EUROPE_COORDS,
	BRITISH_ISLES_COORDS,
	IRELAND_COORDS,
	AFRICA_COORDS,
	MADAGASCAR_COORDS,
	ASIA_MAINLAND_COORDS,
	INDIA_COORDS,
	SRI_LANKA_COORDS,
	JAPAN_COORDS,
	AUSTRALIA_COORDS,
	TASMANIA_COORDS,
	NZ_NORTH_COORDS,
	NZ_SOUTH_COORDS,
	BORNEO_COORDS,
	SUMATRA_COORDS,
	JAVA_COORDS,
	SULAWESI_COORDS,
	PAPUA_COORDS,
	PHILIPPINES_COORDS,
} from './data/globe-coastline-data';

export type GlobePoint = {lat: number; lon: number; label: string};

// ===== ORTHOGRAPHIC PROJECTION =====
const GLOBE_R = 200;
const CX = 250;
const CY = 250;
const CENTER_LAT = 15; // slightly north — better view of flight path
const CENTER_LON = 60; // centered between NZ and Europe

const toRad = (d: number) => (d * Math.PI) / 180;

function project(lat: number, lon: number): {x: number; y: number; visible: boolean} {
	const latR = toRad(lat);
	const lonR = toRad(lon);
	const cLatR = toRad(CENTER_LAT);
	const cLonR = toRad(CENTER_LON);

	const cosC =
		Math.sin(cLatR) * Math.sin(latR) +
		Math.cos(cLatR) * Math.cos(latR) * Math.cos(lonR - cLonR);

	const x = CX + GLOBE_R * Math.cos(latR) * Math.sin(lonR - cLonR);
	const y =
		CY -
		GLOBE_R *
			(Math.cos(cLatR) * Math.sin(latR) -
				Math.sin(cLatR) * Math.cos(latR) * Math.cos(lonR - cLonR));

	return {x, y, visible: cosC > -0.05};
}

// Build SVG path from coordinate array, skipping invisible points
function buildPath(coords: [number, number][]): string {
	const projected = coords.map(([lat, lon]) => project(lat, lon));
	const visibleParts: string[] = [];
	let inPath = false;

	for (const p of projected) {
		if (p.visible) {
			visibleParts.push(`${inPath ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
			inPath = true;
		} else {
			inPath = false;
		}
	}
	if (visibleParts.length > 2) visibleParts.push('Z');
	return visibleParts.join(' ');
}

// NZ and Germany projected positions

// Geodesic path between two points, projected onto globe
function geodesicProjected(
	lat1: number, lon1: number, lat2: number, lon2: number, n: number
): {x: number; y: number; visible: boolean}[] {
	const lat1R = toRad(lat1), lon1R = toRad(lon1);
	const lat2R = toRad(lat2), lon2R = toRad(lon2);
	const d = Math.acos(
		Math.sin(lat1R) * Math.sin(lat2R) +
		Math.cos(lat1R) * Math.cos(lat2R) * Math.cos(lon2R - lon1R)
	);

	const pts: {x: number; y: number; visible: boolean}[] = [];
	for (let i = 0; i <= n; i++) {
		const f = i / n;
		const A = Math.sin((1 - f) * d) / Math.sin(d);
		const B = Math.sin(f * d) / Math.sin(d);
		const x = A * Math.cos(lat1R) * Math.cos(lon1R) + B * Math.cos(lat2R) * Math.cos(lon2R);
		const y = A * Math.cos(lat1R) * Math.sin(lon1R) + B * Math.cos(lat2R) * Math.sin(lon2R);
		const z = A * Math.sin(lat1R) + B * Math.sin(lat2R);
		const latI = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);
		const lonI = Math.atan2(y, x) * (180 / Math.PI);
		pts.push(project(latI, lonI));
	}
	return pts;
}

// All continent definitions with their display properties
const CONTINENTS: {coords: [number, number][]; opacity: number; strokeWidth: number}[] = [
	{coords: EUROPE_COORDS, opacity: 0.45, strokeWidth: 1},
	{coords: BRITISH_ISLES_COORDS, opacity: 0.4, strokeWidth: 0.8},
	{coords: IRELAND_COORDS, opacity: 0.4, strokeWidth: 0.8},
	{coords: AFRICA_COORDS, opacity: 0.4, strokeWidth: 1},
	{coords: MADAGASCAR_COORDS, opacity: 0.35, strokeWidth: 0.8},
	{coords: ASIA_MAINLAND_COORDS, opacity: 0.35, strokeWidth: 1},
	{coords: INDIA_COORDS, opacity: 0.4, strokeWidth: 0.8},
	{coords: SRI_LANKA_COORDS, opacity: 0.35, strokeWidth: 0.8},
	{coords: JAPAN_COORDS, opacity: 0.35, strokeWidth: 0.8},
	{coords: AUSTRALIA_COORDS, opacity: 0.4, strokeWidth: 1},
	{coords: TASMANIA_COORDS, opacity: 0.35, strokeWidth: 0.8},
	{coords: NZ_NORTH_COORDS, opacity: 0.55, strokeWidth: 1.5},
	{coords: NZ_SOUTH_COORDS, opacity: 0.55, strokeWidth: 1.5},
	{coords: BORNEO_COORDS, opacity: 0.3, strokeWidth: 0.8},
	{coords: SUMATRA_COORDS, opacity: 0.3, strokeWidth: 0.8},
	{coords: JAVA_COORDS, opacity: 0.3, strokeWidth: 0.8},
	{coords: SULAWESI_COORDS, opacity: 0.3, strokeWidth: 0.8},
	{coords: PAPUA_COORDS, opacity: 0.3, strokeWidth: 0.8},
	{coords: PHILIPPINES_COORDS, opacity: 0.3, strokeWidth: 0.8},
];

export const GlobeFlightPath: React.FC<{startFrame: number; from?: GlobePoint; to?: GlobePoint; distanceKm?: number; distanceLabel?: (km: number) => string; caption?: string; captionFontSize?: number; theme?: PartialVisualsTheme}> = ({
	startFrame,
	from = {lat: -41, lon: 174, label: 'A'},
	to = {lat: 51, lon: 10, label: 'B'},
	distanceKm = 12000,
	distanceLabel = (km) => `${km.toLocaleString('en-US')} km`,
	caption = 'Halfway around the globe',
	captionFontSize = 46,
	theme,
}) => {
	const {colors, fonts} = useVisualsTheme(theme);
	const fromPos = project(from.lat, from.lon);
	const toPos = project(to.lat, to.lon);
	const frame = useCurrentFrame();
	const elapsed = Math.max(0, frame - startFrame);

	// Faster fade-in
	const globeOpacity = interpolate(elapsed, [0, 12], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Flight starts earlier for longer hold at end
	const flightProgress = interpolate(elapsed, [12, 95], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.quad),
	});

	// Compute geodesic path
	const geodesic = geodesicProjected(from.lat, from.lon, to.lat, to.lon, 60);
	const planeIdx = Math.min(Math.floor(flightProgress * 60), 59);
	const planePos = geodesic[planeIdx] || geodesic[0];
	const nextPos = geodesic[Math.min(planeIdx + 1, 60)] || planePos;
	const planeAngle = Math.atan2(nextPos.y - planePos.y, nextPos.x - planePos.x) * (180 / Math.PI);

	// Trail
	const trailEnd = Math.floor(flightProgress * 60);
	const trailPts = geodesic
		.slice(0, trailEnd + 1)
		.filter(p => p.visible)
		.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
		.join(' ');

	const distanceSoFar = Math.round(flightProgress * distanceKm);
	const arrived = flightProgress > 0.95;
	const arrivalPulse = arrived
		? interpolate(elapsed, [95, 115], [0, 1], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			})
		: 0;

	// Build all continent paths
	const continentPaths = CONTINENTS.map(c => ({
		path: buildPath(c.coords),
		opacity: c.opacity,
		strokeWidth: c.strokeWidth,
	}));

	// Orthographic grid: latitude circles
	const latCircles = [23.5, 0, -23.5].map(lat => {
		const pts: string[] = [];
		for (let lon = -180; lon <= 180; lon += 3) {
			const p = project(lat, lon);
			if (p.visible) pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
		}
		return pts.join(' ');
	});

	// Longitude meridians (denser steps for smooth curves)
	const lonLines = [0, 30, 60, 90, 120, 150, -30, -60].map(lon => {
		const pts: string[] = [];
		for (let lat = -80; lat <= 80; lat += 3) {
			const p = project(lat, lon);
			if (p.visible) pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
		}
		return pts.join(' ');
	});

	return (
		<div style={{position: 'relative', width: 500, height: 640, opacity: globeOpacity}}>
			<svg width="500" height="500" viewBox="0 0 500 500">
				<defs>
					{/* 3D sphere shading — lit from upper-left */}
					<radialGradient id="globeShade" cx="38%" cy="32%" r="55%">
						<stop offset="0%" stopColor="white" stopOpacity="0.18" />
						<stop offset="50%" stopColor="white" stopOpacity="0.0" />
						<stop offset="85%" stopColor="black" stopOpacity="0.08" />
						<stop offset="100%" stopColor="black" stopOpacity="0.15" />
					</radialGradient>
					{/* Atmosphere glow */}
					<filter id="atmosphereGlow">
						<feGaussianBlur stdDeviation="5" />
					</filter>
				</defs>

				{/* Atmosphere glow behind globe */}
				<circle cx={CX} cy={CY} r={GLOBE_R + 10} fill="none"
					stroke={colors.accent} strokeWidth="8" opacity={0.06}
					filter="url(#atmosphereGlow)" />

				{/* Globe circle — white with gold rim and subtle shadow */}
				<circle cx={CX} cy={CY} r={GLOBE_R + 2} fill={colors.foreground} stroke={colors.accent} strokeWidth="3" />

				{/* Grid lines — orthographic curves */}
				<g opacity={0.1}>
					{latCircles.map((pts, i) =>
						pts.length > 0 ? (
							<polyline key={`lat-${i}`} points={pts} fill="none" stroke={colors.accent} strokeWidth="0.6" />
						) : null
					)}
					{lonLines.map((pts, i) =>
						pts.length > 0 ? (
							<polyline key={`lon-${i}`} points={pts} fill="none" stroke={colors.accent} strokeWidth="0.5" />
						) : null
					)}
				</g>

				{/* Continents — orthographically projected */}
				{continentPaths.map((c, i) =>
					c.path ? (
						<path key={i} d={c.path} fill={colors.accent} opacity={c.opacity}
							stroke={colors.accent} strokeWidth={c.strokeWidth} strokeLinejoin="round" />
					) : null
				)}

				{/* 3D sphere shading overlay */}
				<circle cx={CX} cy={CY} r={GLOBE_R} fill="url(#globeShade)" />

				{/* Origin marker */}
				{fromPos.visible && (
					<>
						<circle cx={fromPos.x} cy={fromPos.y} r="8" fill={colors.accent} opacity={0.8} />
						<text x={fromPos.x + 14} y={fromPos.y + 5} fontSize="20" fontWeight="700" fill={colors.accent}>{from.label}</text>
					</>
				)}

				{/* Destination marker */}
				{toPos.visible && (
					<>
						<circle cx={toPos.x} cy={toPos.y} r="8" fill={colors.accent} opacity={arrived ? 1 : 0.5} />
						<text x={toPos.x - 36} y={toPos.y - 12} fontSize="20" fontWeight="700" fill={colors.accent}>{to.label}</text>
					</>
				)}

				{/* Geodesic flight trail */}
				{trailEnd > 0 && trailPts.length > 0 && (
					<polyline
						points={trailPts}
						fill="none"
						stroke={colors.accent}
						strokeWidth="3"
						strokeDasharray="10 5"
						opacity={0.9}
					/>
				)}

				{/* Airplane */}
				{flightProgress > 0.01 && flightProgress < 0.98 && planePos.visible && (
					<g transform={`translate(${planePos.x}, ${planePos.y}) rotate(${planeAngle})`}>
						<ellipse cx="0" cy="0" rx="14" ry="4.5" fill={colors.accent} />
						<polygon points="-3,-12 4,-3 7,-3 0,-12" fill={colors.accent} />
						<polygon points="-3,12 4,3 7,3 0,12" fill={colors.accent} />
						<polygon points="-12,-6 -14,0 -12,6 -9,0" fill={colors.accent} />
					</g>
				)}

				{/* Arrival pulse */}
				{arrived && toPos.visible && (
					<>
						<circle cx={toPos.x} cy={toPos.y} r={8 + arrivalPulse * 30} fill="none" stroke={colors.accent} strokeWidth="2.5" opacity={1 - arrivalPulse} />
						<circle cx={toPos.x} cy={toPos.y} r={8 + arrivalPulse * 18} fill="none" stroke={colors.accent} strokeWidth="1.5" opacity={(1 - arrivalPulse) * 0.5} />
					</>
				)}
			</svg>

			{/* Distance counter + subtitle — below globe */}
			<div
				style={{
					position: 'absolute',
					bottom: 0,
					left: '50%',
					transform: 'translateX(-50%)',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 8,
				}}
			>
				<div
					style={{
						fontFamily: fonts.body,
						fontSize: 44,
						fontWeight: 700,
						color: colors.accent,
						whiteSpace: 'nowrap',
					}}
				>
					{distanceLabel(distanceSoFar)}
				</div>
				<div
					style={{
						fontFamily: fonts.body,
						fontSize: captionFontSize,
						fontWeight: 500,
						color: colors.muted,
						whiteSpace: 'nowrap',
						textAlign: 'center',
					}}
				>
					{caption}
				</div>
			</div>
		</div>
	);
};
