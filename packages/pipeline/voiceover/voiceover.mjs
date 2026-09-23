#!/usr/bin/env node
// Voiceover pipeline: script per reel → voice presets → provider TTS per
// segment → exact pauses → normalised 48 kHz clip → whisper word timestamps →
// subtitle pages → generated voice index for the reel.
//
//   node voiceover.mjs <client> <reelId> [--voice <preset | provider/voiceId>] [--force]
//                                        [--model small|medium|base] [--no-transcribe]
//                                        [--resubtitle] [--list-voices]
//
// Reads  projects/<client>/src/reels/<reelId>/script.md   (or script.ts)
//        assets/voices/presets.json → <client>/src/brand/voices.json → <reel>/voices.json
// Writes projects/<client>/public/audio/<reelId>/<scene>.wav      (48 kHz mono, -18 LUFS)
//        projects/<client>/src/reels/<reelId>/voice/generated.ts  (durations, pages)
// Clips are cached by their recipe hash; only changed scenes are re-synthesised.
import {existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {
	HARNESS_DIR, alignToScript, concatWithSilence, durationMs, ensureWhisper, loadEnv, normaliseClip,
	pageCaptions, readVoiceIndex, sha1, toWhisperInput, transcribeWords, writeVoiceIndex,
} from './lib.mjs';
import {emphasisPerWord} from './script.mjs';
import {loadScript} from './load.mjs';
import {loadPresets, resolveVoice} from './presets.mjs';
import {getProvider, parseVoiceSpec, providerIds} from './providers/index.mjs';
import * as piper from './providers/piper.mjs';

// ---- args ------------------------------------------------------------------
const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i++) {
	const a = argv[i];
	if (a.startsWith('--')) {
		const k = a.slice(2);
		const next = argv[i + 1];
		if (next !== undefined && !next.startsWith('--')) { flags[k] = next; i++; } else flags[k] = true;
	} else positional.push(a);
}
const [client, reelId] = positional;
const PROJECT = client ? join(HARNESS_DIR, 'projects', client) : null;
const REEL = PROJECT && reelId ? join(PROJECT, 'src/reels', reelId) : null;

if (flags['list-voices']) {
	const presets = loadPresets({harnessDir: HARNESS_DIR, projectDir: PROJECT, reelDir: REEL, knownProviders: providerIds()});
	console.log(`providers: ${providerIds().join(', ')}`);
	console.log(`piper voices installed: ${piper.listVoices().join(', ') || '(none)'}`);
	console.log(`presets (default: ${presets.default}):`);
	for (const p of Object.values(presets.voices)) {
		console.log(`  ${p.name.padEnd(20)} ${p.provider}/${p.voiceId}  ${p.language}${p.model ? `  model=${p.model}` : ''}  [${p.layer}]`);
	}
	process.exit(0);
}
if (!client || !reelId) {
	console.error('usage: voiceover.mjs <client> <reelId> [--voice <preset|provider/voiceId>] [--force] [--model small] [--no-transcribe] [--resubtitle] [--list-voices]');
	process.exit(2);
}

// ---- paths -----------------------------------------------------------------
const AUDIO_DIR = join(PROJECT, 'public/audio', reelId);
const AUDIO_REL = `audio/${reelId}`;
const INDEX = join(REEL, 'voice/generated.ts');
const LEGACY_INDEX = join(REEL, 'voice/index.ts');
const CACHE = join(AUDIO_DIR, '.cache.json');

loadEnv();
const {script, source} = await loadScript(REEL, {projectDir: PROJECT}).catch((e) => { console.error(e.message); process.exit(1); });
const presets = loadPresets({harnessDir: HARNESS_DIR, projectDir: PROJECT, reelDir: REEL, knownProviders: providerIds()});
const model = flags.model || 'small';
const transcribeOn = !flags['no-transcribe'];
const resubtitle = Boolean(flags.resubtitle); // reuse clips, redo transcription + paging
mkdirSync(AUDIO_DIR, {recursive: true});
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const previous = readVoiceIndex(INDEX);
if (existsSync(join(REEL, 'voice.json'))) console.log(`  note: ${reelId}/voice.json is no longer read — delete it, ${source} is the source`);
if (existsSync(LEGACY_INDEX)) console.log(`  note: ${reelId}/voice/index.ts is the old generated file — delete it, voice/generated.ts replaces it`);

// ---- voice per scene --------------------------------------------------------
// --voice "provider/id" builds an ad-hoc preset for quick tests; --voice "name"
// forces one preset for every scene. Otherwise: scene voice → script voice → default.
let forced = null;
if (flags.voice) {
	if (String(flags.voice).includes('/')) {
		const {providerId, voiceId} = parseVoiceSpec(flags.voice);
		forced = {name: 'cli', provider: providerId, voiceId, language: resolveVoice(null, presets).language, layer: 'cli'};
	} else forced = resolveVoice(flags.voice, presets);
}
const voiceFor = (scene) => forced ?? resolveVoice(scene.voice ?? script.voice, presets);
for (const scene of script.scenes) voiceFor(scene); // fail early on unknown names

// ---- main -------------------------------------------------------------------
const started = Date.now();
const defaultVoice = voiceFor({voice: null});
console.log(`voiceover  ${client}/${reelId}  source=${source}  voice=${defaultVoice.name} (${defaultVoice.provider}/${defaultVoice.voiceId})  scenes=${script.scenes.length}  transcribe=${transcribeOn ? model : 'off'}`);
if (transcribeOn) {
	console.log('  whisper: ensuring whisper.cpp and model (first run compiles, minutes)…');
	await ensureWhisper(model, (m) => console.log(m));
}

const scenes = {};
let synthesised = 0, reused = 0;
for (const scene of script.scenes) {
	const voice = voiceFor(scene);
	const provider = getProvider(voice.provider);
	const segments = scene.segments.map((s) => ({text: provider.supportsEmphasis ? s.marked : s.text, pauseAfterMs: s.pauseAfterMs}));
	const recipe = {provider: voice.provider, voiceId: voice.voiceId, language: voice.language, model: voice.model ?? null, settings: voice.settings ?? null, segments, v: 3};
	const hash = sha1(JSON.stringify(recipe));
	const wav = join(AUDIO_DIR, `${scene.id}.wav`);
	const fresh = !flags.force && cache[scene.id] === hash && existsSync(wav);

	let pages;
	if (fresh) {
		reused++;
		pages = resubtitle ? null : (previous?.scenes?.[scene.id]?.pages ?? null);
	} else {
		const label = voice.name === 'cli' ? `${voice.provider}/${voice.voiceId}` : `${voice.name}${scene.voice ? ' (scene)' : ''}`;
		process.stdout.write(`  ${scene.id.padEnd(12)} ${label}${provider.untested ? ' (untested adapter)' : ''}${segments.length > 1 ? `  ${segments.length} segments` : ''} … `);
		const parts = [];
		for (let i = 0; i < segments.length; i++) {
			const outBase = join(AUDIO_DIR, `.${scene.id}.seg${i}`);
			const {path: raw} = await provider.synthesize({
				text: segments[i].text, voiceId: voice.voiceId, language: voice.language, model: voice.model, settings: voice.settings, outBase,
			});
			const part = `${outBase}.wav`;
			normaliseClip(raw, part);
			rmSync(raw, {force: true});
			parts.push(part);
		}
		concatWithSilence(parts, segments.map((s) => s.pauseAfterMs), `${wav}.tmp.wav`);
		parts.forEach((p) => rmSync(p, {force: true}));
		renameSync(`${wav}.tmp.wav`, wav);
		synthesised++;
		pages = null;
		console.log(`${(durationMs(wav) / 1000).toFixed(2)} s`);
	}

	if (transcribeOn && !pages) {
		const w16 = join(AUDIO_DIR, `.${scene.id}.16k.wav`);
		toWhisperInput(wav, w16);
		const heard = await transcribeWords(w16, {model, language: voice.language});
		rmSync(w16, {force: true});
		// Subtitles show the WRITTEN form (scene.subtitle), timed by the recogniser.
		const words = alignToScript(heard, scene.subtitle);
		const flagsEm = emphasisPerWord(scene.subtitle, scene.emphasis);
		words.forEach((w, i) => { if (flagsEm[i]) w.emphasis = true; });
		pages = pageCaptions(words);
		const heardText = heard.map((w) => w.text).join(' ');
		console.log(`  ${''.padEnd(12)} subtitles: ${words.length} words → ${pages.length} page(s)${flagsEm.some(Boolean) ? `, ${flagsEm.filter(Boolean).length} emphasised` : ''}`);
		const norm = (s) => s.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
		if (norm(heardText) !== norm(scene.spoken)) {
			console.log(`  ${''.padEnd(12)} heard:    "${heardText}"  ← check pronunciation`);
		}
	}

	scenes[scene.id] = {
		file: `${AUDIO_REL}/${scene.id}.wav`,
		durationMs: durationMs(wav),
		preset: voice.name,
		provider: voice.provider,
		voice: voice.voiceId,
		language: voice.language,
		text: scene.spoken,
		subtitle: scene.subtitle,
		pages: pages ?? [],
	};
	cache[scene.id] = hash;
}

writeFileSync(CACHE, JSON.stringify(cache, null, 2));
writeVoiceIndex(INDEX, {
	generatedAt: new Date().toISOString(),
	source,
	language: defaultVoice.language,
	pauseBeforeMs: script.pauseBeforeMs,
	pauseAfterMs: script.pauseAfterMs,
	scenes,
}, source);

const totalMs = Object.values(scenes).reduce((a, s) => a + s.durationMs, 0);
console.log(`\ndone in ${((Date.now() - started) / 1000).toFixed(0)} s — ${synthesised} synthesised, ${reused} reused, ${(totalMs / 1000).toFixed(1)} s of speech`);
console.log(`  clips: ${AUDIO_DIR}`);
console.log(`  index: ${INDEX}`);
for (const [id, s] of Object.entries(scenes)) {
	console.log(`  ${id.padEnd(12)} ${(s.durationMs / 1000).toFixed(2).padStart(6)} s  ${s.pages.length} page(s)  ${s.pages[0]?.text ?? ''}`);
}
