// Load a reel's script from disk: `script.md` (screenplay markdown, the
// default) or `script.ts` (code, via defineScript from @harness/pipeline/script).
// Exactly one of the two may exist. Both yield the same Script structure.
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {HARNESS_DIR} from './lib.mjs';
import {ScriptError, normaliseScript, parseScript} from './script.mjs';

export async function loadScript(reelDir, {projectDir} = {}) {
	const md = join(reelDir, 'script.md');
	const ts = join(reelDir, 'script.ts');
	const legacy = join(reelDir, 'voice.json');
	const hasMd = existsSync(md);
	const hasTs = existsSync(ts);
	if (hasMd && hasTs) throw new ScriptError(`${reelDir}: both script.md and script.ts exist — keep one source per reel`);
	if (!hasMd && !hasTs) {
		const hint = existsSync(legacy)
			? ' A voice.json is present but no longer read: convert it to script.md (one "## sceneId" heading per scene, the spoken text as prose, "> subtitle:" where the written form differs).'
			: '';
		throw new ScriptError(`${reelDir}: no script.md (or script.ts) found.${hint}`);
	}
	if (hasMd) return {script: parseScript(readFileSync(md, 'utf8')), source: 'script.md'};
	return {script: normaliseScript(await importTs(ts, projectDir), 'script.ts'), source: 'script.ts'};
}

/** Bundle script.ts with esbuild (from the client's node_modules) and import its default export. */
async function importTs(file, projectDir) {
	const esbuild = await loadEsbuild(projectDir);
	const dir = mkdtempSync(join(tmpdir(), 'harness-script-'));
	const out = join(dir, 'script.mjs');
	try {
		await esbuild.build({
			entryPoints: [file],
			outfile: out,
			bundle: true,
			platform: 'node',
			format: 'esm',
			target: 'node22',
			logLevel: 'silent',
			alias: {'@harness/pipeline/script': join(HARNESS_DIR, 'packages/pipeline/script.mjs')},
		});
		const mod = await import(`${pathToFileURL(out).href}?t=${Date.now()}`);
		if (!mod.default) throw new ScriptError(`${file}: must "export default defineScript({...})"`);
		return mod.default;
	} catch (e) {
		if (e instanceof ScriptError) throw e;
		throw new ScriptError(`${file}: ${e.message}`);
	} finally {
		rmSync(dir, {recursive: true, force: true});
	}
}

async function loadEsbuild(projectDir) {
	const candidates = [];
	if (projectDir) candidates.push(join(projectDir, 'package.json'));
	candidates.push(import.meta.url);
	for (const from of candidates) {
		try {
			const req = createRequire(from);
			return await import(pathToFileURL(req.resolve('esbuild')).href);
		} catch { /* try the next */ }
	}
	throw new ScriptError('script.ts needs esbuild, which @remotion/bundler ships with every client project — run npm install in the project');
}

/** For tests: write a script.ts into a temp reel dir and load it. */
export function tempReelDir(files) {
	const dir = mkdtempSync(join(tmpdir(), 'harness-reel-'));
	for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
	return dir;
}
