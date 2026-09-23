import React from 'react';
import {useCurrentFrame} from 'remotion';

export const Typewriter: React.FC<{
	text: string;
	startFrame?: number;
	charFrames?: number;
	style?: React.CSSProperties;
}> = ({text, startFrame = 0, charFrames = 2, style}) => {
	const frame = useCurrentFrame();
	const elapsed = Math.max(0, frame - startFrame);
	const chars = Math.min(text.length, Math.floor(elapsed / charFrames));
	const displayed = text.slice(0, chars);

	return <span style={style}>{displayed}</span>;
};
