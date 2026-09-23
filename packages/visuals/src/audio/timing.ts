// Voice-derived scene timing. Pure arithmetic, no hooks, so a reel's timing.ts
// stays module-level and Root.tsx can read DURATION_FRAMES statically.
//
//   export const {VOICE_START, SCENE_DURATION, SCENE_START, DURATION_FRAMES, DUCK_WINDOWS} =
//     deriveVoiceTiming(VOICE, {hook: 150, far: 180, cta: 150}, {fps: FPS, transition: 12});
//
// Scene order = key order of `designed`. A scene's length is its designed
// length or the voice's (pause + clip + pause), whichever is longer — speech
// is never sped up to fit. Scenes missing from the index keep their designed length.
import type {DuckWindow} from './MusicBed';
import {voiceFrames, voiceStartFrame, type VoiceIndex} from './voice-types';

export type VoiceTiming<K extends string> = {
	/** Frame within each scene at which its clip starts. */
	VOICE_START: number;
	SCENE_DURATION: Record<K, number>;
	/** Composition frame at which each scene starts (transitions overlap). */
	SCENE_START: Record<K, number>;
	DURATION_FRAMES: number;
	/** Speech windows in composition milliseconds, for <MusicBed duckWindows>. */
	DUCK_WINDOWS: DuckWindow[];
};

export function deriveVoiceTiming<K extends string>(
	index: VoiceIndex,
	designed: Record<K, number>,
	options: {
		fps: number;
		/** Overlap of the transition after each scene: one number for all, or per preceding scene. */
		transition: number | Partial<Record<K, number>>;
	},
): VoiceTiming<K> {
	const {fps, transition} = options;
	const ids = Object.keys(designed) as K[];
	if (ids.length === 0) throw new Error('deriveVoiceTiming: `designed` needs at least one scene');
	const overlap = (id: K): number => (typeof transition === 'number' ? transition : transition[id] ?? 0);

	const SCENE_DURATION = {} as Record<K, number>;
	for (const id of ids) SCENE_DURATION[id] = Math.max(designed[id], voiceFrames(index, id, fps));

	const SCENE_START = {} as Record<K, number>;
	ids.forEach((id, i) => {
		SCENE_START[id] = i === 0 ? 0 : SCENE_START[ids[i - 1]] + SCENE_DURATION[ids[i - 1]] - overlap(ids[i - 1]);
	});

	const last = ids[ids.length - 1];
	const VOICE_START = voiceStartFrame(index, fps);
	const DUCK_WINDOWS: DuckWindow[] = ids
		.filter((id) => index.scenes[id])
		.map((id) => {
			const startMs = ((SCENE_START[id] + VOICE_START) / fps) * 1000;
			return {startMs, endMs: startMs + index.scenes[id].durationMs};
		});

	return {VOICE_START, SCENE_DURATION, SCENE_START, DURATION_FRAMES: SCENE_START[last] + SCENE_DURATION[last], DUCK_WINDOWS};
}
