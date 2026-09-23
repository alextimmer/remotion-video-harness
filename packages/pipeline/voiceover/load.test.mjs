// node --test packages/pipeline/voiceover/load.test.mjs
// script.ts loading needs esbuild from a project's node_modules; the format
// template serves as that project here.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {HARNESS_DIR} from './lib.mjs';
import {loadScript, tempReelDir} from './load.mjs';

const PROJECT = join(HARNESS_DIR, 'templates/insta-reel');
const hasEsbuild = existsSync(join(PROJECT, 'node_modules/esbuild/package.json'));

test('script.md loads', async () => {
	const dir = tempReelDir({'script.md': 'voice: narrator\n\n## a\nHello.\n'});
	const {script, source} = await loadScript(dir);
	assert.equal(source, 'script.md');
	assert.equal(script.scenes[0].spoken, 'Hello.');
});

test('script.ts via defineScript loads through esbuild', {skip: !hasEsbuild && 'template node_modules not installed'}, async () => {
	const dir = tempReelDir({'script.ts': `
import {defineScript} from '@harness/pipeline/script';
const km = 12000;
export default defineScript({
	voice: 'default-de-male', pauseBefore: 0.3,
	scenes: {hook: 'Hello.', far: {text: \`\${km} kilometres [pause 0.4] far away\`, subtitle: '12,000 km – far away'}},
});`});
	const {script, source} = await loadScript(dir, {projectDir: PROJECT});
	assert.equal(source, 'script.ts');
	assert.equal(script.voice, 'default-de-male');
	assert.equal(script.pauseBeforeMs, 300);
	assert.equal(script.scenes[1].spoken, '12000 kilometres far away');
	assert.equal(script.scenes[1].segments.length, 2);
});

test('both sources → error; none → hint about the old voice.json', async () => {
	const both = tempReelDir({'script.md': '## a\nA.\n', 'script.ts': 'export default {scenes:{a:"A"}}'});
	await assert.rejects(loadScript(both), /both script.md and script.ts/);
	const none = tempReelDir({'voice.json': '{}'});
	await assert.rejects(loadScript(none), /voice.json is present but no longer read/);
});
