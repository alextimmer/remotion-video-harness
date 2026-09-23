// ElevenLabs: cloud TTS with voice cloning. Needs ELEVENLABS_API_KEY in the
// harness .env. UNTESTED — written against the public REST API without a key
// at hand; the first run with a key is the test (82-open-decisions.md).
//
// Voice cloning of a real person needs that person's written consent and
// terms that allow it, recorded in the client's 20-legal.md first.
//
// Preset fields: `model` → model_id (default eleven_multilingual_v2);
// `settings` → voice_settings untouched (stability, similarity_boost, style, speed, …).
import {writeFileSync} from 'node:fs';

export const id = 'elevenlabs';
export const needsKey = 'ELEVENLABS_API_KEY';
export const untested = true;
// The REST text-to-speech body has no per-word emphasis markup; *emphasis*
// is stripped. Revisit if a prosody feature becomes available.
export const supportsEmphasis = false;

export function describe() {
	return 'elevenlabs (cloud, cloning) — key ELEVENLABS_API_KEY; UNTESTED until a key exists';
}

export async function synthesize({text, voiceId, language, model, settings, outBase}) {
	const key = process.env[needsKey];
	const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
	const body = {
		text,
		model_id: model || process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
		language_code: language,
	};
	if (settings && Object.keys(settings).length) body.voice_settings = settings;
	const res = await fetch(url, {
		method: 'POST',
		headers: {'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg'},
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`ElevenLabs ${res.status} ${res.statusText} for voice "${voiceId}": ${text.slice(0, 300)}`);
	}
	const out = `${outBase}.raw.mp3`;
	writeFileSync(out, Buffer.from(await res.arrayBuffer()));
	return {path: out};
}
