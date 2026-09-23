// Piper: free, local, offline text-to-speech (MIT). The devcontainer image
// ships the binary at PIPER_BIN and voices at PIPER_VOICES (see
// assets/voices/piper-voices.txt). No key, no network. Output is NOT
// bit-identical between runs (the model samples noise; clip lengths vary by a
// few hundred ms), which is why clips are cached and committed with the reel.
//
// Preset `settings` (all optional, passed through from voices.json):
//   lengthScale     speaking rate, 1.0 = normal, >1 slower (Piper --length_scale)
//   sentenceSilence seconds between sentences, default 0.25
//   noiseScale, noiseW  synthesis variability (Piper defaults 0.667 / 0.8)
//   speaker         speaker id for multi-speaker voices
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {HARNESS_DIR} from '../lib.mjs';

export const id = 'piper';
export const needsKey = undefined;
// Piper has no prosody markup; *emphasis* is stripped before synthesis.
export const supportsEmphasis = false;

const bin = () => process.env.PIPER_BIN || '/opt/piper/piper';
const voicesDir = () => process.env.PIPER_VOICES || '/opt/piper/voices';

export function describe() {
	return `piper (local, free) — binary ${bin()}, voices in ${voicesDir()}`;
}

/** The harness default preset's Piper voice (assets/voices/presets.json), for messages and the CLI escape hatch. */
export function defaultVoice() {
	try {
		const presets = JSON.parse(readFileSync(join(HARNESS_DIR, 'assets/voices/presets.json'), 'utf8'));
		const p = presets.voices[presets.default];
		if (p?.provider === 'piper') return p.voiceId;
	} catch { /* fall through */ }
	try {
		const list = readFileSync(join(HARNESS_DIR, 'assets/voices/piper-voices.txt'), 'utf8')
			.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
		return list[0].split('/').pop();
	} catch {
		return 'de_DE-thorsten-high';
	}
}

export function listVoices() {
	if (!existsSync(voicesDir())) return [];
	return readdirSync(voicesDir()).filter((f) => f.endsWith('.onnx')).map((f) => f.replace(/\.onnx$/, ''));
}

export async function synthesize({text, voiceId, settings = {}, outBase}) {
	if (!existsSync(bin())) {
		throw new Error(`Piper binary not found at ${bin()}. Rebuild the devcontainer (Dockerfile installs it) or set PIPER_BIN.`);
	}
	const model = join(voicesDir(), `${voiceId}.onnx`);
	if (!existsSync(model)) {
		throw new Error(`Piper voice "${voiceId}" not found in ${voicesDir()}. Available: ${listVoices().join(', ') || 'none'}. Add it to assets/voices/piper-voices.txt and rebuild.`);
	}
	const out = `${outBase}.raw.wav`;
	const args = ['--model', model, '--output_file', out, '--sentence_silence', String(settings.sentenceSilence ?? 0.25)];
	if (settings.lengthScale !== undefined) args.push('--length_scale', String(settings.lengthScale));
	if (settings.noiseScale !== undefined) args.push('--noise_scale', String(settings.noiseScale));
	if (settings.noiseW !== undefined) args.push('--noise_w', String(settings.noiseW));
	if (settings.speaker !== undefined) args.push('--speaker', String(settings.speaker));
	const r = spawnSync(bin(), args, {input: text, encoding: 'utf8'});
	if (r.status !== 0 || !existsSync(out)) {
		throw new Error(`piper failed for "${text.slice(0, 40)}…": ${(r.stderr || '').trim()}`);
	}
	return {path: out};
}
