// Voice presets: a named voice with everything the pipeline needs. Scripts
// name presets; presets carry provider configuration. Three JSON layers, the
// later ones extend or override the earlier:
//
//   harness  assets/voices/presets.json            free defaults
//   brand    <project>/src/brand/voices.json       the client's voices (a brand decision)
//   reel     <project>/src/reels/<id>/voices.json  extra or overriding voices for one reel
//
// File shape (identical in every layer):
//   {"default": "name", "voices": {"name": {"provider", "voiceId", "language", "model"?, "settings"?}}}
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

export class PresetError extends Error {}

function readLayer(file, layer, required) {
	if (!existsSync(file)) {
		if (required) throw new PresetError(`${layer} presets missing: ${file}`);
		return null;
	}
	let json;
	try { json = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { throw new PresetError(`${file}: not valid JSON (${e.message})`); }
	if (!json || typeof json !== 'object') throw new PresetError(`${file}: must be an object with "voices"`);
	if (json.voices !== undefined && (typeof json.voices !== 'object' || Array.isArray(json.voices))) {
		throw new PresetError(`${file}: "voices" must be an object keyed by preset name`);
	}
	if (json.default !== undefined && typeof json.default !== 'string') throw new PresetError(`${file}: "default" must be a preset name`);
	return {file, layer, default: json.default, voices: json.voices ?? {}};
}

function validatePreset(name, p, file, knownProviders) {
	if (!p || typeof p !== 'object') throw new PresetError(`${file}: preset "${name}" must be an object`);
	if (!p.provider || typeof p.provider !== 'string') throw new PresetError(`${file}: preset "${name}" has no "provider"`);
	if (knownProviders && !knownProviders.includes(p.provider)) {
		throw new PresetError(`${file}: preset "${name}" names unknown provider "${p.provider}". Known: ${knownProviders.join(', ')}`);
	}
	if (!p.voiceId || typeof p.voiceId !== 'string') throw new PresetError(`${file}: preset "${name}" has no "voiceId"`);
	if (!p.language || typeof p.language !== 'string') throw new PresetError(`${file}: preset "${name}" has no "language" (e.g. "de")`);
	if (p.settings !== undefined && (typeof p.settings !== 'object' || Array.isArray(p.settings))) {
		throw new PresetError(`${file}: preset "${name}": "settings" must be an object`);
	}
}

/**
 * Load and merge the three layers. Only the harness file is required.
 * Returns {default, voices: {name: {...preset, name, layer, file}}}.
 */
export function loadPresets({harnessDir, projectDir, reelDir, knownProviders = null} = {}) {
	const layers = [
		readLayer(join(harnessDir, 'assets/voices/presets.json'), 'harness', true),
		projectDir ? readLayer(join(projectDir, 'src/brand/voices.json'), 'brand', false) : null,
		reelDir ? readLayer(join(reelDir, 'voices.json'), 'reel', false) : null,
	].filter(Boolean);
	const merged = {default: undefined, voices: {}};
	for (const layer of layers) {
		for (const [name, p] of Object.entries(layer.voices)) {
			validatePreset(name, p, layer.file, knownProviders);
			merged.voices[name] = {...p, name, layer: layer.layer, file: layer.file};
		}
		if (layer.default !== undefined) merged.default = layer.default;
	}
	if (merged.default && !merged.voices[merged.default]) {
		const src = [...layers].reverse().find((l) => l.default === merged.default);
		throw new PresetError(`${src.file}: "default" names unknown preset "${merged.default}". ${listKnown(merged)}`);
	}
	if (!merged.default) throw new PresetError(`no "default" preset in any layer. ${listKnown(merged)}`);
	return merged;
}

function listKnown(presets) {
	const names = Object.values(presets.voices).map((p) => `${p.name} (${p.layer})`);
	return names.length ? `Known presets: ${names.join(', ')}.` : 'No presets defined.';
}

/** Resolve a preset name (null → default) to its full definition, or fail listing every known name. */
export function resolveVoice(name, presets) {
	const key = name ?? presets.default;
	const p = presets.voices[key];
	if (!p) {
		throw new PresetError(
			`unknown voice preset "${key}". ${listKnown(presets)} ` +
			`Define it in src/brand/voices.json (client voices) or src/reels/<id>/voices.json (one reel).`,
		);
	}
	return p;
}
