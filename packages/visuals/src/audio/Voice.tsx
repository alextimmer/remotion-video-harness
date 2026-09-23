import React, {createContext, useContext} from 'react';
import {Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Captions} from '../captions/Captions';
import type {PartialVisualsTheme} from '../theme';
import {voiceStartFrame, type VoiceIndex} from './voice-types';

// One line per scene instead of Sequence/Audio/staticFile/Captions boilerplate:
//
//   <VoiceProvider index={VOICE}>          once, in Reel.tsx (inside the theme provider)
//   <Voice scene="far" />                  in a scene: the clip, after the script's pause-before
//   <Voice scene="region" subtitles />      the clip plus burnt-in subtitles
//
// The generated index comes from scripts/voiceover.sh (src/reels/<id>/voice/generated.ts).

const VoiceContext = createContext<VoiceIndex | null>(null);

export const VoiceProvider: React.FC<{index: VoiceIndex; children: React.ReactNode}> = ({index, children}) => (
	<VoiceContext.Provider value={index}>{children}</VoiceContext.Provider>
);

/** The reel's voice index. Throws outside a <VoiceProvider>. */
export const useVoice = (): VoiceIndex => {
	const index = useContext(VoiceContext);
	if (!index) {
		throw new Error('useVoice()/<Voice> needs a <VoiceProvider index={VOICE}> around the reel (Reel.tsx, inside <VisualsThemeProvider>).');
	}
	return index;
};

export const Voice: React.FC<{
	/** Scene id as in the script (`## sceneId`). */
	scene: string;
	/** Also render burnt-in subtitles for this scene. Omit where the spoken line is already on screen (22-craft-audio.md). */
	subtitles?: boolean;
	/** Distance of the subtitle plate from the bottom edge; default clears the platform UI zone. */
	subtitlesBottom?: number;
	subtitlesFontSize?: number;
	subtitlesMaxWidth?: number;
	/** Clip gain, 0–1. */
	volume?: number;
	theme?: PartialVisualsTheme;
}> = ({scene, subtitles = false, subtitlesBottom, subtitlesFontSize, subtitlesMaxWidth, volume = 1, theme}) => {
	const index = useVoice();
	const {fps} = useVideoConfig();
	const s = index.scenes[scene];
	// scripts/new-reel.sh writes a placeholder index (source "placeholder", no
	// scenes) so a fresh reel compiles and previews silently until
	// scripts/voiceover.sh has run. A real index never has that source.
	if (!s && index.source === 'placeholder') return null;
	if (!s) {
		throw new Error(`<Voice scene="${scene}">: no such scene in the voice index. Scenes: ${Object.keys(index.scenes).join(', ')}. Add "## ${scene}" to the script and re-run scripts/voiceover.sh.`);
	}
	const start = voiceStartFrame(index, fps);
	return (
		<>
			<Sequence from={start} layout="none">
				<Audio src={staticFile(s.file)} volume={volume} />
			</Sequence>
			{subtitles ? (
				<Captions pages={s.pages} offsetFrames={start} bottom={subtitlesBottom} fontSize={subtitlesFontSize} maxWidth={subtitlesMaxWidth} theme={theme} />
			) : null}
		</>
	);
};
