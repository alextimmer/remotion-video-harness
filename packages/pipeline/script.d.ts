/**
 * `@harness/pipeline/script` — declare a voiceover script in code.
 *
 * Prefer `src/reels/<id>/script.md`; use `script.ts` only where the text is
 * assembled from data or many variants. One source per reel — never both.
 *
 * ```ts
 * import {defineScript} from '@harness/pipeline/script';
 * export default defineScript({
 *   voice: 'narrator',                 // preset name from voices.json (omit → default preset)
 *   pauseBefore: 0.4, pauseAfter: 0.7, // seconds of silence around every clip
 *   scenes: {
 *     hook: 'Spoken text of the hook.',                                      // string = spoken text
 *     far: {text: 'Twelve thousand [pause 0.4] kilometres', subtitle: '12,000 km', voice: 'warm'},
 *   },
 * });
 * ```
 * Markers inside text: `[pause N]` (seconds of silence), `*emphasis*`.
 */
export type ScriptScene =
	| string
	| {
			/** Spoken text. May contain `[pause N]` and `*emphasis*` markers. */
			text: string;
			/** Written form for subtitles where it differs from the spoken form. */
			subtitle?: string;
			/** Preset name overriding the script's voice for this scene. */
			voice?: string;
	  };

export type Script = {
	/** Preset name; omit for the default preset of the most specific voices.json layer. */
	voice?: string;
	/** Silence before the first word, seconds (default 0.4). */
	pauseBefore?: number;
	/** Silence after the last word, seconds (default 0.7). */
	pauseAfter?: number;
	/** Scene id → spoken text or scene object. Ids match `[a-zA-Z0-9-]+`. */
	scenes: Record<string, ScriptScene>;
};

export function defineScript<T extends Script>(script: T): T;
