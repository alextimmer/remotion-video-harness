// node --test packages/pipeline/voiceover/presets.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {loadPresets, resolveVoice} from './presets.mjs';

const PROVIDERS = ['piper', 'elevenlabs'];

function fixture({harness, brand, reel}) {
	const root = mkdtempSync(join(tmpdir(), 'presets-'));
	const write = (rel, obj) => {
		const f = join(root, rel);
		mkdirSync(join(f, '..'), {recursive: true});
		writeFileSync(f, typeof obj === 'string' ? obj : JSON.stringify(obj));
	};
	if (harness) write('harness/assets/voices/presets.json', harness);
	if (brand) write('project/src/brand/voices.json', brand);
	if (reel) write('project/src/reels/r/voices.json', reel);
	return {harnessDir: join(root, 'harness'), projectDir: join(root, 'project'), reelDir: join(root, 'project/src/reels/r')};
}

const HARNESS = {
	default: 'default-male',
	voices: {
		'default-male': {provider: 'piper', voiceId: 'x-male-high', language: 'de'},
		'default-female': {provider: 'piper', voiceId: 'x-female-low', language: 'de'},
	},
};

test('layers: reel overrides brand overrides harness; most specific default wins', () => {
	const dirs = fixture({
		harness: HARNESS,
		brand: {default: 'narrator', voices: {narrator: {provider: 'piper', voiceId: 'brand-voice', language: 'de'}}},
		reel: {voices: {narrator: {provider: 'elevenlabs', voiceId: 'abc', language: 'de', model: 'm', settings: {stability: 0.5}}, second: {provider: 'piper', voiceId: 'y', language: 'en'}}},
	});
	const p = loadPresets({...dirs, knownProviders: PROVIDERS});
	assert.equal(p.default, 'narrator');
	assert.equal(resolveVoice(null, p).voiceId, 'abc');
	assert.equal(resolveVoice('narrator', p).layer, 'reel');
	assert.deepEqual(resolveVoice('narrator', p).settings, {stability: 0.5});
	assert.equal(resolveVoice('default-female', p).layer, 'harness');
	assert.equal(resolveVoice('second', p).language, 'en');
});

test('harness only: works without brand or reel files', () => {
	const dirs = fixture({harness: HARNESS});
	const p = loadPresets({...dirs, knownProviders: PROVIDERS});
	assert.equal(resolveVoice(null, p).name, 'default-male');
});

test('unknown name lists every known preset with its layer', () => {
	const dirs = fixture({harness: HARNESS, brand: {voices: {narrator: {provider: 'piper', voiceId: 'v', language: 'de'}}}});
	const p = loadPresets({...dirs, knownProviders: PROVIDERS});
	assert.throws(() => resolveVoice('warm', p), /unknown voice preset "warm".*default-male \(harness\).*narrator \(brand\).*voices\.json/s);
});

test('errors: missing harness file, bad provider, missing fields, bad default, invalid JSON', () => {
	assert.throws(() => loadPresets({...fixture({}), knownProviders: PROVIDERS}), /harness presets missing/);
	assert.throws(
		() => loadPresets({...fixture({harness: HARNESS, brand: {voices: {x: {provider: 'nope', voiceId: 'v', language: 'de'}}}}), knownProviders: PROVIDERS}),
		/preset "x" names unknown provider "nope". Known: piper, elevenlabs/,
	);
	assert.throws(() => loadPresets({...fixture({harness: {default: 'a', voices: {a: {provider: 'piper', voiceId: 'v'}}}})}), /has no "language"/);
	assert.throws(() => loadPresets({...fixture({harness: HARNESS, brand: {default: 'ghost'}})}), /"default" names unknown preset "ghost"/);
	assert.throws(() => loadPresets({...fixture({harness: '{not json'})}), /not valid JSON/);
	assert.throws(() => loadPresets({...fixture({harness: {voices: HARNESS.voices}})}), /no "default" preset/);
});
