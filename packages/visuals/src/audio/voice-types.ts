// The shape of a reel's generated voice index (`src/reels/<id>/voice/generated.ts`),
// written by the pipeline (`scripts/voiceover.sh`). Data only; behaviour lives in
// <Voice>, <Captions> and deriveVoiceTiming(). Times are milliseconds.

/** One word with its timing relative to the clip start. */
export type VoiceWord = {
	text: string;
	startMs: number;
	endMs: number;
	/** Marked `*like this*` in the script: rendered bold and in the accent for the page's whole life. */
	emphasis?: boolean;
};

/** One subtitle "page": what is on screen at once (≤ 2 lines). */
export type VoicePage = {
	text: string;
	startMs: number;
	endMs: number;
	words: readonly VoiceWord[];
};

export type VoiceScene = {
	/** Path for staticFile(), e.g. `audio/<reelId>/<scene>.wav`. */
	file: string;
	durationMs: number;
	/** Preset name the scene was voiced with (voices.json). */
	preset: string;
	provider: string;
	voice: string;
	language: string;
	/** Spoken form, markers stripped. */
	text: string;
	/** Written form shown in subtitles. */
	subtitle: string;
	pages: readonly VoicePage[];
};

export type VoiceIndex = {
	generatedAt: string;
	/** `script.md` or `script.ts`. */
	source: string;
	language: string;
	/** Silence before the first word of every scene. */
	pauseBeforeMs: number;
	/** Silence after the last word of every scene. */
	pauseAfterMs: number;
	scenes: Record<string, VoiceScene>;
};

/** Frames a scene needs for its voice: pause + clip + pause, at the given fps. 0 for scenes without voice. */
export const voiceFrames = (index: VoiceIndex, sceneId: string, fps: number): number => {
	const s = index.scenes[sceneId];
	if (!s) return 0;
	return Math.ceil(((index.pauseBeforeMs + s.durationMs + index.pauseAfterMs) / 1000) * fps);
};

/** Frame within a scene at which its clip starts. */
export const voiceStartFrame = (index: VoiceIndex, fps: number): number => Math.round((index.pauseBeforeMs / 1000) * fps);
