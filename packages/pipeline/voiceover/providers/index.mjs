// Provider registry. A provider is a plugin with one job: turn text into an
// audio file. Everything else (segmenting on pauses, normalising, measuring,
// transcribing, paging) is shared and provider-independent.
//
//   interface Provider {
//     id: string;                       // 'piper', 'elevenlabs', …
//     needsKey?: string;                // env var name, if any
//     untested?: boolean;               // shipped without a live test
//     supportsEmphasis?: boolean;       // true: receives *emphasis* markers in `text`; false: stripped
//     describe(): string;
//     listVoices?(): string[];          // for error messages / --list-voices
//     synthesize({text, voiceId, language, model?, settings?, outBase}): Promise<{path: string}>
//                                       // writes outBase + '.<ext>' and returns its path.
//                                       // `model` and `settings` come from the voice preset untouched.
//   }
//
// Voices are chosen through presets (presets.mjs). The CLI escape hatch
// "--voice provider/voiceId" is parsed by parseVoiceSpec.
import * as piper from './piper.mjs';
import * as elevenlabs from './elevenlabs.mjs';

const PROVIDERS = {piper, elevenlabs};

export function parseVoiceSpec(spec) {
	const m = /^([a-z0-9_-]+)\/(.+)$/i.exec(spec ?? '');
	if (!m) throw new Error(`voice must be "provider/voiceId", got "${spec}"`);
	return {providerId: m[1].toLowerCase(), voiceId: m[2]};
}

export function getProvider(id) {
	const p = PROVIDERS[id];
	if (!p) throw new Error(`unknown TTS provider "${id}". Known: ${Object.keys(PROVIDERS).join(', ')}`);
	if (p.needsKey && !process.env[p.needsKey]) {
		throw new Error(
			`provider "${id}" needs ${p.needsKey} in .env (harness root, git-ignored). ` +
			`No key? Use a free local preset (assets/voices/presets.json) or --voice piper/${piper.defaultVoice()}`,
		);
	}
	return p;
}

export const providerIds = () => Object.keys(PROVIDERS);
