#!/usr/bin/env node
// Static check of a client's voice configuration, for scripts/check-client.sh:
//   node check.mjs <projectDir>
// - src/brand/voices.json (if present) parses, has a default, names known providers
// - every src/reels/*/script.md or script.ts parses and names only resolvable presets
// - no reel still carries the retired voice.json / voice/index.ts
// Prints one line per finding prefixed PASS/WARN/FAIL; exit 1 on any FAIL.
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {HARNESS_DIR} from './lib.mjs';
import {loadScript} from './load.mjs';
import {loadPresets, resolveVoice} from './presets.mjs';
import {providerIds} from './providers/index.mjs';

const projectDir = process.argv[2];
if (!projectDir) { console.error('usage: check.mjs <projectDir>'); process.exit(2); }
let fail = 0;
const pass = (m) => console.log(`PASS  ${m}`);
const warn = (m) => console.log(`WARN  ${m}`);
const bad = (m) => { console.log(`FAIL  ${m}`); fail = 1; };

const brandFile = join(projectDir, 'src/brand/voices.json');
let brandPresets = null;
try {
	brandPresets = loadPresets({harnessDir: HARNESS_DIR, projectDir, knownProviders: providerIds()});
	if (existsSync(brandFile)) pass(`src/brand/voices.json valid — default "${brandPresets.default}", ${Object.values(brandPresets.voices).filter((p) => p.layer === 'brand').length} client preset(s)`);
	else warn('no src/brand/voices.json — voiced reels fall back to the harness default preset (a voice is a brand decision)');
} catch (e) {
	bad(`voice presets: ${e.message}`);
}

const reelsDir = join(projectDir, 'src/reels');
const reels = existsSync(reelsDir) ? readdirSync(reelsDir, {withFileTypes: true}).filter((d) => d.isDirectory()).map((d) => d.name) : [];
let scripted = 0;
for (const reel of reels) {
	const reelDir = join(reelsDir, reel);
	if (existsSync(join(reelDir, 'voice.json')) || existsSync(join(reelDir, 'voice/index.ts'))) {
		bad(`${reel}: retired voice.json / voice/index.ts present — convert to script.md and re-run scripts/voiceover.sh`);
	}
	if (!existsSync(join(reelDir, 'script.md')) && !existsSync(join(reelDir, 'script.ts'))) continue;
	scripted++;
	try {
		const {script, source} = await loadScript(reelDir, {projectDir});
		const presets = loadPresets({harnessDir: HARNESS_DIR, projectDir, reelDir, knownProviders: providerIds()});
		const names = new Set([script.voice, ...script.scenes.map((s) => s.voice)].filter(Boolean));
		for (const n of names) resolveVoice(n, presets);
		resolveVoice(null, presets);
		const genFile = join(reelDir, 'voice/generated.ts');
		const gen = existsSync(genFile) && !readFileSync(genFile, 'utf8').includes('"source": "placeholder"');
		const todo = script.scenes.filter((s) => /^TODO/.test(s.spoken)).length;
		pass(`${reel}/${source}: ${script.scenes.length} scene(s), voices ${[...names].join(', ') || `default (${presets.default})`}`);
		if (!gen) warn(`${reel}: voice/generated.ts not generated yet (placeholder or missing) — run scripts/voiceover.sh`);
		if (todo) warn(`${reel}/${source}: ${todo} scene(s) still carry the scaffold's TODO line`);
	} catch (e) {
		bad(`${reel}: ${e.message}`);
	}
}
if (scripted === 0 && reels.length) warn('no reel has a script.md yet (voiceover is optional)');
process.exit(fail);
